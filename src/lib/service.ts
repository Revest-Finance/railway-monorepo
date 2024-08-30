import { Contract, formatEther, formatUnits, WeiPerEther } from "ethers";

import { getEnqueuedEvents, getPool } from "@resonate/db/index";
import { ClientEvent, QueueState } from "@resonate/models";

import { PROVIDERS } from "./constants";
import { price_provider_contracts, resonate_contracts } from "./contracts";
import { getEthPrice } from "./prices";

async function getTokenPrice(chainId: number, token: string): Promise<bigint> {
    const contract = price_provider_contracts[chainId];

    return await contract.getSafePrice(token);
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

            console.log("asset amount", assetAmount);

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
) {
    if (isProvider && !isCrossAsset) {
        return (packets * packetSize * rate) / WeiPerEther;
    }

    if (isProvider) {
        return (((rate * packetSize) / WeiPerEther) * packets * depositedShares) / WeiPerEther;
    }

    const packetSizeDenominator = 10n ** BigInt(packetSizeDecimals);

    return (packets * packetSize) / packetSizeDenominator;
}

export async function getPoolQueues(chainId: number, poolId: string): Promise<QueueState> {
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

    const events = await getQueueState(chainId, poolId, head, tail, isProvider ? "EnqueueProvider" : "EnqueueConsumer");

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

    return {
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
}
