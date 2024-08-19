import { ethers, formatUnits, getBigInt } from "ethers";
import { readVaultsFromProvider, updateVault } from "@resonate/db";
import axios from "axios";

interface APY {
    result: {
        seniorVault: {
            aaveSupplyApy: number;
            glpRewardsPct: number;
            _glpRewardsPct: number;
        };
        juniorVault: {
            btcBorrowApy: number;
            ethBorrowApy: number;
            glpTraderPnl: number;
            glpRewardsPct: number;
            _glpRewardsPct: number;
            esGmxRewards: number;
        };
    };
    cacheTimestamp: number;
}

interface INFO {
    result: {
        nativeProtocolName: string;
        poolComposition: {
            rageAmountD6: number;
            nativeAmountD6: number;
            rageAmount: number;
            nativeAmount: number;
            ragePercentage: number;
            nativePercentage: number;
        };
        totalSupply: {
            value: number;
            decimals: number;
            formatted: number;
        };
        totalShares: {
            value: number;
            decimals: number;
            formatted: number;
        };
        totalAssets: {
            value: number;
            decimals: number;
            formatted: number;
        };
        assetsPerShare: {
            value: number;
            decimals: number;
            formatted: number;
        };
        assetPrice: {
            value: number;
            decimals: number;
            formatted: number;
        };
        sharePrice: {
            value: number;
            decimals: number;
            formatted: number;
        };
        depositCap: {
            value: number;
            decimals: number;
            formatted: number;
        };
        vaultMarketValue: {
            value: number;
            decimals: number;
            formatted: number;
        };
        vaultMarketValuePending: {
            value: number;
            decimals: number;
            formatted: number;
        };
        avgVaultMarketValue: {
            value: number;
            decimals: number;
            formatted: number;
        };
    };
    cacheTimestamp: number;
}

export async function rageTrade() {
    const vaults = await readVaultsFromProvider("Rage Trade");
    if (!vaults) return;

    const APY_URL = `https://apis.rage.trade/data/v2/get-dn-gmx-apy-breakdown?networkName=arbmain`;
    const apy_res = (await axios.get(APY_URL)).data as APY;

    const JUNIOR_TVL_URL = `https://apis.rage.trade/data/v2/get-vault-info?networkName=arbmain&vaultName=dn_gmx_junior`;
    const SENIOR_TVL_URL = `https://apis.rage.trade/data/v2/get-vault-info?networkName=arbmain&vaultName=dn_gmx_senior`;
    const junior_tvl_res = (await axios.get(JUNIOR_TVL_URL)).data as INFO;
    const senior_tvl_res = (await axios.get(SENIOR_TVL_URL)).data as INFO;

    await updateVault({
        ...vaults.find(vault => vault.symbol == "DN_GMX_SENIOR")!,
        apy: (apy_res.result.seniorVault.aaveSupplyApy + apy_res.result.seniorVault.glpRewardsPct) / 100,
        tvl: parseFloat(
            formatUnits(
                getBigInt(senior_tvl_res.result.totalAssets.value) * getBigInt(senior_tvl_res.result.assetPrice.value),
                senior_tvl_res.result.totalAssets.decimals + senior_tvl_res.result.assetPrice.decimals,
            ),
        ).toFixed(2),
    });
    await updateVault({
        ...vaults.find(vault => vault.symbol == "DN_GMX_JUNIOR")!,
        apy:
            (apy_res.result.juniorVault.glpTraderPnl +
                apy_res.result.juniorVault.glpRewardsPct +
                apy_res.result.juniorVault.esGmxRewards +
                apy_res.result.juniorVault.btcBorrowApy +
                apy_res.result.juniorVault.ethBorrowApy) /
            100,
        tvl: parseFloat(
            ethers.formatUnits(
                getBigInt(junior_tvl_res.result.totalAssets.value) * getBigInt(junior_tvl_res.result.assetPrice.value),
                junior_tvl_res.result.totalAssets.decimals + junior_tvl_res.result.assetPrice.decimals,
            ),
        ).toFixed(2),
    });
}
