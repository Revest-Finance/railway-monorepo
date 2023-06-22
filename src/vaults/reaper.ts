import { readVaultsFromProvider, updateVault } from "../lib/db.indexers"
import axios from "axios"
const CHAIN_IDS = [10, 250]

const CHAINS: {[chainid: number] : string} = {
    10: "optimism/",
    250: ""
}

interface ICryptStats {
    _id: string,
    provider: string,
    cryptContent: {
        name: string,
        pid: number,
        rfSymbol: string,
        tokens: {
            name: string,
            address: string
        }[],
        fees: {
            depositFee: number
            withdrawFee: number
            interestFee: number
        },
        strategy: {
            address: string,
            abiName: string
        },
        lpToken: {
            address: string,
            abiName: string,
        },
        vault: {
            address: string,
            abiName: string
        }
        url: string,
        dead: boolean,
        newAnalytics: boolean,
        singleSided: boolean
    }
    emissionMultiplier: number
    analytics: {
        assets: any,
        tvl: number,
        yields: {
            day: number,
            week: number,
            month: number
            year: number
        }
    }
    __v: number
}
export async function reaper() {
    const vaults = await readVaultsFromProvider("Reaper Farm")
    if (!vaults) return;
    await Promise.all(CHAIN_IDS.map( async (chainid) => {
        const vaults_by_chainid = vaults.filter( vault => vault.chainid == chainid);
        const URL = `https://yzo0r3ahok.execute-api.us-east-1.amazonaws.com/dev/api/${CHAINS[chainid]}crypts`
        const crypt_info_arr: ICryptStats[] = (await axios.get(URL)).data.data
        await Promise.all(vaults_by_chainid.map( vault => {
            const crypt_info = crypt_info_arr.find( crypt => crypt.cryptContent.vault.address.toLowerCase() == vault.address.toLowerCase() )
            if (!crypt_info) {
                console.error(`[${chainid}] [${vault.symbol}] stats missing for ${vault.address}`)
                return
            }
            return updateVault({
                ...vault,
                apy: crypt_info.analytics.yields.year,
                tvl: crypt_info.analytics.tvl.toFixed(2)
            })
        }))
    }))
}