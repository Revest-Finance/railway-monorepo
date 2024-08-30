import { EventLog, formatUnits } from "ethers";
import { PRICE_PROVIDER_GENESIS } from "./constants";
import { price_provider_contracts, redux_cex_contract, resonate_contracts } from "./contracts";
import { EnqueuedEvent, ProcessingEvent, ReduxRequest, Transfer } from "@resonate/models";

const redux = redux_cex_contract[42161]!;

export async function getBalanceOf(address: string): Promise<number> {
    return Number(formatUnits(await redux.balanceOf(address), 18));
}

type Redeems = Omit<ReduxRequest, "id" | "processingEventId"> & { txHash: string };

export async function getRedeems(blockNumber = 0): Promise<Redeems[]> {
    const depositRequestProcessed = redux.filters.RedeemRequestProcessed();
    const depositRequests = await redux.queryFilter(depositRequestProcessed, blockNumber);

    const requests = depositRequests
        .map(event => event as EventLog)
        .map(async (depositRequest: EventLog) => {
            const output: Redeems = {
                userAddress: depositRequest.args.receiver,
                assets: Number(formatUnits(depositRequest.args.shares, 6)),
                shares: Number(formatUnits(depositRequest.args.assets, 18)),
                txHash: depositRequest.transactionHash,
                type: "RedeemRequestProcessed",
            };

            return output;
        });

    return await Promise.all(requests);
}

type Deposits = Omit<ReduxRequest, "id" | "processingEventId"> & { txHash: string };

export async function getDeposits(blockNumber = 0): Promise<Deposits[]> {
    const depositRequestProcessed = redux.filters.DepositRequestProcessed();
    const depositRequests = await redux.queryFilter(depositRequestProcessed, blockNumber);

    const requests = depositRequests
        .map(event => event as EventLog)
        .map(async (depositRequest: EventLog) => {
            const output: Deposits = {
                type: "DepositRequestProcessed",
                shares: 0,
                assets: Number(formatUnits(depositRequest.args.assets, 6)),
                userAddress: depositRequest.args.owner,
                txHash: depositRequest.transactionHash,
            };

            return output;
        });

    return await Promise.all(requests);
}

type Transfers = Omit<Transfer, "id" | "processingEventId"> & { txHash: string };

export async function getTransfers(blockNumber = 0): Promise<Transfers[]> {
    const transfer = redux.filters.Transfer();
    const transfers = await redux.queryFilter(transfer, blockNumber);

    const requests = transfers
        .map(event => event as EventLog)
        .map(async (transfer: EventLog) => {
            const blockTimestamp = (await transfer.getBlock()).timestamp;

            const output: Transfers = {
                fromAddress: transfer.args.from,
                toAddress: transfer.args.to,
                amount: Number(formatUnits(transfer.args.amount, 18)),
                blockNumber: transfer.blockNumber,
                blockTimestamp: new Date(blockTimestamp * 1000).toISOString(),
                txHash: transfer.transactionHash,
            };

            return output;
        });

    return await Promise.all(requests);
}

type RatioUpdates = Omit<ProcessingEvent, "id"> & { txHash: string };

export async function getRatioUpdates(blockNumber = 0): Promise<RatioUpdates[]> {
    const ratioUpdates = await redux.queryFilter(redux.filters.LatestRatioUpdated(), blockNumber);

    const requests = ratioUpdates
        .map(event => event as EventLog)
        .map(async (ratioUpdate: EventLog) => {
            const { timestamp: blockTimestamp } = await ratioUpdate.getBlock();

            const output: RatioUpdates = {
                totalAssets: Number(formatUnits(ratioUpdate.args.totalValueLocked, 6)),
                ratio: Number(formatUnits(ratioUpdate.args.newRatio, 4)),
                blockNumber: ratioUpdate.blockNumber,
                blockTimestamp: new Date(blockTimestamp * 1000).toISOString(),
                txHash: ratioUpdate.transactionHash,
            };

            return output;
        });

    return await Promise.all(requests);
}

export async function getLatestRatio(): Promise<number> {
    const ratio = await redux.latestRatio();

    return Number(formatUnits(ratio, 4));
}

export async function handleDepositRequests(): Promise<number> {
    const depositRequestProcessed = redux.filters.DepositRequestProcessed();
    const depositRequests = await redux.queryFilter(depositRequestProcessed, 0);

    const result = depositRequests
        .map(x => x as EventLog)
        .map((depositRequest: EventLog) => depositRequest.args.assets);
    const totalDeposited = result.reduce((acc, curr) => acc + curr, 0n);

    return Number(formatUnits(totalDeposited, 6));
}

export async function handleRedeemRequests(): Promise<number> {
    const redeemRequestProcessed = redux.filters.RedeemRequestProcessed();
    const redeemRequests = await redux.queryFilter(redeemRequestProcessed, 0);

    const result = redeemRequests.map(x => x as EventLog).map((redeemRequest: EventLog) => redeemRequest.args.shares);
    const totalRedeemed = result.reduce((acc, curr) => acc + curr, 0n);

    return Number(formatUnits(totalRedeemed, 6));
}

export async function getCapitalActivated(chainId: number, poolId: string, blockNumber = 0): Promise<bigint> {
    const filter = resonate_contracts[chainId].filters.CapitalActivated(poolId);
    const events = await resonate_contracts[chainId].queryFilter(filter, blockNumber, "latest");

    return events.map(event => event as EventLog).reduce((previous, current) => previous + current.args.numPackets, 0n);
}

export type PoolCreation = {
    poolId: string;
    asset: string;
    vault: string;
    payoutAsset: string;
    rate: string;
    addInterestRate: string;
    lockupPeriod: number;
    packetSize: string;
    isFixedTerm: boolean;
    poolName: string;
    creator: string;
    ts: number;
    tx: string;
};

export async function getPoolCreations(chainId: number): Promise<PoolCreation[]> {
    const filter = resonate_contracts[chainId].filters.PoolCreated();
    const events = await resonate_contracts[chainId].queryFilter(filter, 0);

    return events.map((event): PoolCreation => {
        const args = (event as EventLog).args;

        // Due to a bug in the contract, the second item in the pool created event is the payout asset
        // the 4th item is the vault asset, despite what they are labelled.
        return {
            poolId: args.poolId,
            payoutAsset: args.asset,
            vault: args.vault,
            asset: args.payoutAsset,
            rate: String(args.rate),
            addInterestRate: String(args.addInterestRate),
            lockupPeriod: parseInt(args.lockupPeriod),
            packetSize: String(args.packetSize),
            isFixedTerm: args.isFixedTerm,
            poolName: args.poolName,
            creator: args.creator,
            ts: event.blockNumber,
            tx: event.transactionHash,
        };
    });
}

export async function getFNFTCreations(chainId: number): Promise<any> {
    const filter = resonate_contracts[chainId].filters.FNFTCreation();
    const events = await resonate_contracts[chainId].queryFilter(filter, 0);

    return events.map((event): any => {
        const args = (event as EventLog).args;

        return {
            poolId: args.poolId,
            isPrincipal: args.isPrincipal,
            fnftId: args.fnftId,
            quantityFNFTs: args.quantityFNFTs,
            blockNumber: event.blockNumber,
            txHash: event.transactionHash,
        };
    });
}

export async function getFNFTRedeems(chainId: number): Promise<any> {
    const filter = resonate_contracts[chainId].filters.FNFTRedeemed();
    const events = await resonate_contracts[chainId].queryFilter(filter, 0);

    return events.map((event): any => {
        const args = (event as EventLog).args;

        return {
            poolId: args.poolId,
            fnftId: args.fnftId,
            quantityFNFTs: args.quantityFNFTs,
            blockNumber: event.blockNumber,
            txHash: event.transactionHash,
        };
    });
}

export interface RegisteredOracles {
    oracle: string;
    token: string;
    blockNumber: number;
    timestamp: number;
    txHash: string;
}

export async function getRegisteredOracles(
    chainId: number,
    blockNumber = PRICE_PROVIDER_GENESIS,
): Promise<RegisteredOracles[]> {
    const priceProvider = price_provider_contracts[chainId];

    const priceProviderUpdate = priceProvider.filters.SetTokenOracle();

    const events = await priceProvider.queryFilter(priceProviderUpdate, blockNumber);

    const result = events
        .map(x => x as EventLog)
        .map(async (result: EventLog) => {
            const { timestamp } = await result.getBlock();

            return {
                oracle: result.args.oracle,
                token: result.args.token,
                blockNumber: result.blockNumber,
                txHash: result.transactionHash,
                timestamp,
            };
        });

    return await Promise.all(result);
}

export async function getReduxTotalDeposited(): Promise<number> {
    const [totalDeposited, totalRedeemed] = await Promise.all([handleDepositRequests(), handleRedeemRequests()]);

    return totalDeposited - totalRedeemed;
}

export async function extractEnqueuedEvents(
    chainId: number,
    side: "EnqueueConsumer" | "EnqueueProvider",
    startBlock = 0,
): Promise<EnqueuedEvent[]> {
    try {
        const resonate = resonate_contracts[chainId];
        const filter = resonate.filters[side]();

        const currentBlock = await resonate.runner?.provider?.getBlock("latest");

        if (currentBlock?.number === startBlock) {
            console.log(`Too early to extract ${side} events on chain ${chainId}.`);
            return [];
        }

        const events = await resonate.queryFilter(filter, startBlock, currentBlock?.number);

        if (events.length === 0) {
            console.log(`No new ${side} events on chain ${chainId}.`);
            return [];
        }

        console.log(
            `Extracted ${events.length} ${side} events from chain ${chainId}. Queried blocks ${startBlock} to ${currentBlock?.number}.`,
        );

        const poolEvents = events.map(async (event): Promise<EnqueuedEvent> => {
            const { transactionHash, blockNumber } = event;
            const { timestamp } = await event.getBlock();

            const blockTimestamp = new Date(timestamp * 1000);

            const { poolId, position, addr: address, order, shouldFarm } = (event as EventLog).args;
            const [packetsRemaining, depositedShares, owner] = order;

            const orderOwner = owner.slice(0, 42);

            return {
                chainId,
                transactionHash,
                blockTimestamp,
                shouldFarm,
                address,
                orderOwner,
                blockNumber,
                poolId,
                side,
                position: Number(position),
                packetsRemaining: String(packetsRemaining),
                depositedShares: String(depositedShares),
                lastKnownBlock: currentBlock?.number ?? blockNumber,
            };
        });

        return await Promise.all(poolEvents);
    } catch (error) {
        console.error(error);
    }

    return [];
}
