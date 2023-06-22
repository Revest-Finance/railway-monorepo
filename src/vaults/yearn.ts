import { formatUnits } from "ethers"
import { readVaultsFromProvider, updateVault } from "../lib/db.indexers"
import axios from "axios"
const CHAIN_IDS = [1, 10, 250, 42161]

interface YEARN_STATS {
    address: string,
    underlyingTokenBalance: {
        amountUsdc: string
    }
    metadata : {
        apy: {
            net_apy: number
        }
    }
}

export async function yearn() {
    const vaults = await readVaultsFromProvider("Yearn Finance")
    if (!vaults) return;
    await Promise.all(CHAIN_IDS.map( async (chainid) => {
        const vaults_by_chainid = vaults.filter( vault => vault.chainid == chainid)
        const URL = `https://cache.yearn.finance/v1/chains/${chainid}/vaults/get`
        const res = (await axios.get(URL)).data as YEARN_STATS[];
        await Promise.all(vaults_by_chainid.map( vault => {
            const stats = res.find( _json => _json.address.toLowerCase() == vault.address.toLowerCase())
            if (!stats) {
                console.error(`[${chainid}] stats missing for ${vault.address}`)
                return
            }
            updateVault({
                ...vault,
                apy: stats.metadata.apy.net_apy,
                tvl: parseFloat(formatUnits(stats.underlyingTokenBalance.amountUsdc, 6)).toFixed(2)
            })
        }))
    }))
}