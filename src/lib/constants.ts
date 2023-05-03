import axios from "axios"

export const SUBGRAPH_URLS: { [chainid: number]: string } = {
    1: "https://api.thegraph.com/subgraphs/name/ryantinder/resonate-mainnet",
    10: "https://api.thegraph.com/subgraphs/name/ryantinder/resonate-optimism",
    137: "https://api.thegraph.com/subgraphs/name/ryantinder/resonate-polygon",
    250: "https://api.thegraph.com/subgraphs/name/ryantinder/resonate-fantom",
    42161: "https://api.thegraph.com/subgraphs/name/ryantinder/resonate-arbitrum",
}

export const CHAIN_IDS = [1, 10, 137, 250, 42161]

export const eth_price = async (): Promise<number> => {
    const eth_res = await axios.get("https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&vs_currencies=usd")
    return eth_res.data["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"].usd
}

export interface VaultInfo {
    id: number
    chainid: number
    address: string

    name: string
    symbol: string
    logo: string
    url: string

    provider: string
    providerLogo: string
    providerURL: string

    apy: number
    tvl: string

    status: number
}

export interface Pool {
    chainid: number
    poolid: string 
    payoutasset: string 
    vault: string 
    vaultasset: string 
    rate: string 
    addinterestrate: string 
    lockupperiod: number 
    packetsize: string
    packetsizedecimals: number
    isfixedterm: boolean 
    poolname: string 
    creator: string
    ts: number
    tx: string
    tvl: string
    verifiedby: string
    usdvolume: string
}

export interface XRATE {
    id: number
    chainid: number
    token: string
    address: string
    xrate: number
    isLP: boolean
}

export interface Adapter {
    chainid: number
    underlyingVault: string
    vaultAdapter: string
    vaultAsset: string
    ts: number
    status: number
}

export interface Oracle {
    chainid: number
    oracle: string
    asset: string
}