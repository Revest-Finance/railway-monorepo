import { readVaultsFromProvider, updateVault } from "../lib/db.indexers"
import axios from "axios"

interface APY {
    intervalTimestamp: string
    blockNumber: number
    epoch: number
    frxethTotalSupply: number
    sfrxethTotalAssets: number
    sfrxethStoredTotalAssets: number
    sfrxethTotalSupply: number
    sfrxethFrxethPrice: number
    sfrxethApr: number
    frxethEthCurvePrice: number
    frxethEthCurveLpSupply: number
    frxethEthCurveEthBalance: number
    frxethEthCurveFrxethBalance: number
    frxethEthCurveRatio: number
    frxethEthCurveTotalApr: number
    frxethEthCurveAprBreakdown: {
        fxs: number
        crv: number
        cvx: number
        fees: number
    }
    activeValidatorCt: number
    pendingValidatorCt: number
    totalValidatorBalance: number
    validatorMarketShare: number
    cumulativeValidatorBeaconRewards: number
    cumulativeValidatorTipsAndMev: number
    cumulativeBlocksProduced: number
    ethPriceUsd: number
}


const APY_ENDPONT = 'https://api.frax.finance/v2/frxeth/summary/latest'

export async function frax() {
    const vaults = await readVaultsFromProvider("Frax Finance")
    if (!vaults) return

    const apy_res = (await axios.get(APY_ENDPONT)).data as APY;

    await updateVault({
        ...vaults.find( vault => vault.symbol == "sfrxETH")!,
        apy: (apy_res.sfrxethApr / 100),
        tvl: (apy_res.sfrxethTotalSupply * apy_res.sfrxethFrxethPrice * apy_res.ethPriceUsd).toFixed(2)
    })
}