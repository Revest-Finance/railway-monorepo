import { EventLog, formatUnits } from "ethers";
import { redux_cex_contract } from "./contracts";

async function getBalanceOf(address: string): Promise<number> {
    const redux = redux_cex_contract[42161];

    return Number(formatUnits(await redux.balanceOf(address), 18));
}

async function getDeposits(address: string): Promise<{ assets: number; blockNumber: number }[]> {
    const redux = redux_cex_contract[42161];

    const depositRequestProcessed = redux.filters.DepositRequestProcessed(address);
    const depositRequests = await redux.queryFilter(depositRequestProcessed, 0);

    return depositRequests.map((depositRequest: EventLog) => ({
        assets: Number(formatUnits(depositRequest.args.assets, 6)),
        blockNumber: depositRequest.blockNumber,
    }));
}

async function getRedeems(address: string): Promise<{ assets: number; shares: number; blockNumber: number }[]> {
    const redux = redux_cex_contract[42161];

    const depositRequestProcessed = redux.filters.RedeemRequestProcessed(address);
    const depositRequests = await redux.queryFilter(depositRequestProcessed, 0);

    return depositRequests.map((depositRequest: EventLog) => ({
        assets: Number(formatUnits(depositRequest.args.assets, 6)),
        shares: Number(formatUnits(depositRequest.args.shares, 18)),
        blockNumber: depositRequest.blockNumber,
    }));
}

async function getRatioChanges(): Promise<{ ratio: number; blockNumber: number }[]> {
    const redux = redux_cex_contract[42161];

    const ratioChange = redux.filters.LatestRatioUpdated();
    const ratioChanges = await redux.queryFilter(ratioChange, 0);

    return ratioChanges.map((ratioChange: EventLog) => ({
        ratio: Number(formatUnits(ratioChange.args.newRatio, 18)),
        blockNumber: ratioChange.blockNumber,
    }));
}

async function handleDepositRequests(): Promise<number> {
    const redux = redux_cex_contract[42161];

    const depositRequestProcessed = redux.filters.DepositRequestProcessed();
    const depositRequests = await redux.queryFilter(depositRequestProcessed, 0);

    const result = depositRequests.map((depositRequest: EventLog) => depositRequest.args.assets);
    const totalDeposited = result.reduce((acc, curr) => acc + curr, 0n);

    return Number(formatUnits(totalDeposited, 6));
}

async function handleRedeemRequests(): Promise<number> {
    const redux = redux_cex_contract[42161];

    const redeemRequestProcessed = redux.filters.RedeemRequestProcessed();
    const redeemRequests = await redux.queryFilter(redeemRequestProcessed, 0);

    const result = redeemRequests.map((redeemRequest: EventLog) => redeemRequest.args.assets);
    const totalRedeemed = result.reduce((acc, curr) => acc + curr, 0n);

    return Number(formatUnits(totalRedeemed, 6));
}

export async function getIndividualPnL(address: string) {
    const shareBalance = await getBalanceOf(address);

    // Individual PnL is only calculated when user has shares
    if (shareBalance === 0) {
        return 0;
    }

    const [depositsResponse, redeemsResponse] = await Promise.all([getDeposits(address), getRedeems(address)]);
    const ratioChanges = await getRatioChanges();

    const deposits = depositsResponse.map(deposit => {
        const { ratio } = ratioChanges.find(ratioChange => ratioChange.blockNumber === deposit.blockNumber);
        return { ...deposit, ratio };
    });

    const redeems = redeemsResponse.map(redeem => {
        const { ratio } = ratioChanges.find(ratioChange => ratioChange.blockNumber === redeem.blockNumber);
        return { ...redeem, ratio };
    });

    const latestRatio = ratioChanges[ratioChanges.length - 1].ratio;

    redeems.push({
        shares: shareBalance,
        ratio: latestRatio,
        assets: shareBalance * latestRatio,
        blockNumber: Number.MAX_SAFE_INTEGER,
    });

    const records: Record<number, number> = {};

    while (deposits.length > 0) {
        const deposit = deposits[deposits.length - 1];
        const redeem = redeems[0];

        const depositShares = deposit.assets / deposit.ratio;
        const currentAssets = depositShares * redeem.ratio;

        const difference = redeem.assets - currentAssets;
        records[redeem.blockNumber] += difference;

        if (redeem.shares === depositShares) {
            redeems.shift();
            deposits.pop();
        } else if (redeem.shares > depositShares) {
            redeems[0].shares -= depositShares;
            redeems[0].assets -= currentAssets;
            deposits.pop();
        } else if (redeem.shares < depositShares) {
            deposits[deposits.length - 1].assets -= redeem.shares * deposit.ratio;
            redeems.shift();
        }
    }

    console.log(records);

    return null;
}

export async function getReduxTotalDeposited(): Promise<number> {
    const [totalDeposited, totalRedeemed] = await Promise.all([handleDepositRequests(), handleRedeemRequests()]);

    return totalDeposited - totalRedeemed;
}
