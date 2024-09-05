import { Contract, formatEther, formatUnits, WeiPerEther } from "ethers";

import { getEnqueuedEvents, getPool, getPools, getPoolsByName, getToken, getVaultInfo, Pool } from "@resonate/db";
import { ClientEvent, QueueState } from "@resonate/models";

import { PROVIDERS } from "./constants";
import { price_provider_contracts, resonate_contracts } from "./contracts";
import { getEthPrice } from "./prices";
import { Cache } from "./cache";

async function getTokenPrice(chainId: number, token: string): Promise<bigint> {
    const contract = price_provider_contracts[chainId];

    try {
        return await contract.getSafePrice(token);
    } catch (e) {
        console.error(`Failed to fetch price for ${token} on chain ${chainId}`);
        return 0n;
    }
}

async function getQueueState(
    chainId: number,
    poolId: string,
    head: bigint,
    tail: bigint,
    side: "EnqueueProvider" | "EnqueueConsumer",
): Promise<ClientEvent[]> {
    const resonate = resonate_contracts[chainId];
    const events = await getEnqueuedEvents({ chainId, poolId, side });
    const relevantEvents = events.filter(event => event.position >= head);

    const pool = await getPool(chainId, poolId);

    const isProvider = side === "EnqueueProvider";
    const isCrossAsset = pool!.payoutAsset.toLowerCase() !== pool!.vaultAsset.toLowerCase();

    const queuePromises = [];

    for (let i = Number(head); i < Number(tail); i++) {
        const runner = async (): Promise<ClientEvent> => {
            const queue = side === "EnqueueProvider" ? "providerQueue" : "consumerQueue";

            const [packetsRemaining, depositedShares, owner] = await resonate[queue](poolId, BigInt(i));

            const event = relevantEvents.find(event => event.position === i);

            if (!event) {
                throw new Error("Event not found");
            }

            const assetAmount = calculateAssetAmount(
                packetsRemaining,
                BigInt(pool!.packetSize),
                pool!.packetSizeDecimals,
                depositedShares,
                BigInt(pool!.rate),
                isProvider,
                isCrossAsset,
            );

            return {
                chainId,
                poolId,
                owner,
                ts: event.blockTimestamp,
                tx: event.transactionHash,
                depositedShares,
                packetsRemaining,
                isProducer: side === "EnqueueProvider",
                enqueuing: true,
                shouldFarm: event.shouldFarm,
                address: event.address,
                position: event.position,
                assetAmount,
                assetValue: 0,
            };
        };

        queuePromises.push(runner());
    }

    return await Promise.all(queuePromises);
}

async function getAssetPrice(chainId: number, payoutAsset: string, vaultAsset: string, provider: boolean) {
    const mainAsset = provider ? payoutAsset : vaultAsset;
    const crossAsset = payoutAsset.toLowerCase() !== vaultAsset.toLowerCase();

    if (provider && !crossAsset) {
        return WeiPerEther;
    }

    return await getTokenPrice(chainId, mainAsset);
}

export async function getTokenDecimals(chainId: number, token: string) {
    const tokenInfo = await getToken(token, chainId);

    if (!!tokenInfo) {
        return tokenInfo.decimals;
    }

    const provider = PROVIDERS[chainId];
    const contract = new Contract(token, ["function decimals() view returns (uint8)"], provider);

    return await contract.decimals();
}

function calculatePrice(ethPrice: number, assetPrice: bigint, tokenAmount: bigint, tokenDecimals: number) {
    const usd = ethPrice * parseFloat(formatEther(assetPrice));
    return parseFloat(formatUnits(tokenAmount, tokenDecimals)) * usd;
}

function calculateAssetAmount(
    packets: bigint,
    packetSize: bigint,
    packetSizeDecimals: number,
    depositedShares: bigint,
    rate: bigint,
    isProvider: boolean,
    isCrossAsset: boolean,
): bigint {
    if (isProvider && !isCrossAsset) {
        return (packets * packetSize * rate) / WeiPerEther;
    }

    if (isProvider) {
        return (((rate * packetSize) / WeiPerEther) * packets * depositedShares) / WeiPerEther;
    }

    const packetSizeDenominator = 10n ** BigInt(packetSizeDecimals);

    return (packets * packetSize) / packetSizeDenominator;
}

const cache = new Cache<QueueState>();
const cacheDuration = 1000 * 30;

export async function getPoolQueues(chainId: number, poolId: string): Promise<QueueState> {
    if (cache.has(`${chainId}:${poolId}`)) {
        return cache.get(`${chainId}:${poolId}`)!;
    }

    const pool = await getPool(chainId, poolId);

    if (!pool) {
        throw new Error("Pool not found");
    }

    const resonate = resonate_contracts[chainId];

    const [providerHead, providerTail, consumerHead, consumerTail] = await resonate.queueMarkers(poolId);

    if (providerHead === providerTail && consumerHead === consumerTail) {
        console.log("Queue is empty");
        return {
            isProducer: false,
            events: [],
            totalQueuedPackets: 0n,
            adjustedQueuedTokens: 0n,
            totalUsd: 0,
            tokenDecimals: 18,
        };
    }

    const isProvider = consumerHead === consumerTail;

    const head = isProvider ? providerHead : consumerHead;
    const tail = isProvider ? providerTail : consumerTail;

    const startTime = Date.now();

    const events = await getQueueState(chainId, poolId, head, tail, isProvider ? "EnqueueProvider" : "EnqueueConsumer");

    console.log(`Queue state for ${poolId} fetched in ${(Date.now() - startTime) / 1000}s`);

    if (events.length === 0) {
        console.log("No events found");
        return {
            isProducer: isProvider,
            events: [],
            totalQueuedPackets: 0n,
            adjustedQueuedTokens: 0n,
            totalUsd: 0,
            tokenDecimals: 18,
        };
    }

    const totalQueuedPackets = events.reduce((acc, event) => acc + event.packetsRemaining, 0n);

    const assetPrice = await getAssetPrice(chainId, pool.payoutAsset, pool.vaultAsset, isProvider);

    const adjustedQueuedTokens = events.reduce((acc, event) => acc + event.assetAmount, 0n);

    const tokenDecimals = await getTokenDecimals(chainId, isProvider ? pool.payoutAsset : pool.vaultAsset);
    const ethPrice = await getEthPrice();

    const result = {
        isProducer: isProvider,
        totalQueuedPackets,
        adjustedQueuedTokens,
        totalUsd: calculatePrice(ethPrice, assetPrice, adjustedQueuedTokens, tokenDecimals),
        events: events.map(event => ({
            ...event,
            assetValue: calculatePrice(ethPrice, assetPrice, event.assetAmount, tokenDecimals),
        })),
        tokenDecimals,
    };

    cache.set(`${chainId}:${poolId}`, result, cacheDuration);

    return result;
}

const detailedCache = new Cache();

export async function getDetailedPools(chainId: number, poolName?: string) {
    const cacheKey = !poolName ? `pools::${chainId}` : `pools::${chainId}::${poolName}`;
    if (detailedCache.has(cacheKey)) {
        return detailedCache.get(cacheKey)!;
    }

    const pools = !!poolName ? await getPoolsByName(poolName, chainId) : await getPools(chainId);

    const getPoolDetails = async (pool: Pool) => {
        const queueState = await getPoolQueues(chainId, pool.poolId);

        const [vault, vaultToken, payoutToken] = await Promise.all([
            getVaultInfo(pool.vault, chainId),
            getToken(pool.vaultAsset, chainId),
            getToken(pool.payoutAsset, chainId),
        ]);

        return {
            pool,
            queueState,
            vault,
            tokens: {
                vaultToken,
                payoutToken,
            },
        };
    };

    const result = await Promise.all(pools.map(getPoolDetails));

    // Cache for 1 minute
    detailedCache.set(cacheKey, result, 1000 * 60);

    return result;
}
