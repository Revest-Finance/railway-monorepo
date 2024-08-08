import { EventLog, formatUnits } from "ethers";
import { PRICE_PROVIDER_GENESIS } from "./constants";
import { price_provider_contracts, redux_cex_contract } from "./contracts";
import { ProcessingEvent, ReduxRequest, Transfer } from "./interfaces";

export async function getBalanceOf(address: string): Promise<number> {
    const redux = redux_cex_contract[42161];

    return Number(formatUnits(await redux.balanceOf(address), 18));
}

type Redeems = Omit<ReduxRequest, "id" | "processingEventId"> & { txHash: string };

export async function getRedeems(blockNumber = 0): Promise<Redeems[]> {
    const redux = redux_cex_contract[42161];

    const depositRequestProcessed = redux.filters.RedeemRequestProcessed();
    const depositRequests = await redux.queryFilter(depositRequestProcessed, blockNumber);

    const requests = depositRequests.map(async (depositRequest: EventLog) => {
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
    const redux = redux_cex_contract[42161];

    const depositRequestProcessed = redux.filters.DepositRequestProcessed();
    const depositRequests = await redux.queryFilter(depositRequestProcessed, blockNumber);

    const requests = depositRequests.map(async (depositRequest: EventLog) => {
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
    const redux = redux_cex_contract[42161];

    const transfer = redux.filters.Transfer();
    const transfers = await redux.queryFilter(transfer, blockNumber);

    const requests = transfers.map(async (transfer: EventLog) => {
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
    const redux = redux_cex_contract[42161];

    const ratioUpdates = await redux.queryFilter(redux.filters.LatestRatioUpdated(), blockNumber);

    const requests = ratioUpdates.map(async (ratioUpdate: EventLog) => {
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
    const redux = redux_cex_contract[42161];

    const ratio = await redux.latestRatio();

    return Number(formatUnits(ratio, 4));
}

export async function handleDepositRequests(): Promise<number> {
    const redux = redux_cex_contract[42161];

    const depositRequestProcessed = redux.filters.DepositRequestProcessed();
    const depositRequests = await redux.queryFilter(depositRequestProcessed, 0);

    const result = depositRequests.map((depositRequest: EventLog) => depositRequest.args.assets);
    const totalDeposited = result.reduce((acc, curr) => acc + curr, 0n);

    return Number(formatUnits(totalDeposited, 6));
}

export async function handleRedeemRequests(): Promise<number> {
    const redux = redux_cex_contract[42161];

    const redeemRequestProcessed = redux.filters.RedeemRequestProcessed();
    const redeemRequests = await redux.queryFilter(redeemRequestProcessed, 0);

    const result = redeemRequests.map((redeemRequest: EventLog) => redeemRequest.args.shares);
    const totalRedeemed = result.reduce((acc, curr) => acc + curr, 0n);

    return Number(formatUnits(totalRedeemed, 6));
}

export async function getRegisteredOracles(
    chainId: number,
): Promise<{ oracle: string; token: string; blockNumber: number }[]> {
    const priceProvider = price_provider_contracts[chainId];

    const priceProviderUpdate = priceProvider.filters.SetTokenOracle();

    const results = await priceProvider.queryFilter(priceProviderUpdate, PRICE_PROVIDER_GENESIS);

    return results.map((result: EventLog) => ({
        oracle: result.args.oracle,
        token: result.args.token,
        blockNumber: result.blockNumber,
    }));
}

export async function getReduxTotalDeposited(): Promise<number> {
    const [totalDeposited, totalRedeemed] = await Promise.all([handleDepositRequests(), handleRedeemRequests()]);

    return totalDeposited - totalRedeemed;
}
