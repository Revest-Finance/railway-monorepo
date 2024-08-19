import axios from "axios";

import { readVaultsFromProvider, updateVault } from "@resonate/db";

interface APY {
    intervalTimestamp: string;
    blockNumber: number;
    epoch: number;
    frxethTotalSupply: number;
    sfrxethTotalAssets: number;
    sfrxethStoredTotalAssets: number;
    sfrxethTotalSupply: number;
    sfrxethFrxethPrice: number;
    sfrxethApr: number;
    frxethEthCurvePrice: number;
    frxethEthCurveLpSupply: number;
    frxethEthCurveEthBalance: number;
    frxethEthCurveFrxethBalance: number;
    frxethEthCurveRatio: number;
    frxethEthCurveTotalApr: number;
    frxethEthCurveAprBreakdown: {
        fxs: number;
        crv: number;
        cvx: number;
        fees: number;
    };
    activeValidatorCt: number;
    pendingValidatorCt: number;
    totalValidatorBalance: number;
    validatorMarketShare: number;
    cumulativeValidatorBeaconRewards: number;
    cumulativeValidatorTipsAndMev: number;
    cumulativeBlocksProduced: number;
    ethPriceUsd: number;
}

const fraxUrl = "https://api.frax.finance/v2/frxeth/summary/latest";

export async function frax() {
    const vaults = await readVaultsFromProvider("Frax Finance");

    if (vaults.length === 0) {
        return;
    }

    const result = (await axios.get(fraxUrl)).data as APY;

    const tvl = (result.sfrxethTotalSupply * result.sfrxethFrxethPrice * result.ethPriceUsd).toFixed(2);
    const apy = result.sfrxethApr / 100;

    await updateVault({
        ...vaults.find(vault => vault.symbol == "sfrxETH")!,
        apy,
        tvl,
    });
}
