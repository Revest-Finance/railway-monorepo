import { EventLog, formatUnits } from "ethers";
import { redux_cex_contract } from "./contracts";

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

export async function getReduxTotalDeposited(): Promise<number> {
    const [totalDeposited, totalRedeemed] = await Promise.all([handleDepositRequests(), handleRedeemRequests()]);

    return totalDeposited - totalRedeemed;
}
