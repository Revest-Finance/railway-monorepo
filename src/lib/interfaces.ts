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
    packetvolume: string
    isfixedterm: boolean 
    poolname: string 
    creator: string
    verifiedby: string
    ts: number
    tx: string
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
    ts: number
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


export interface XRATE {
    id: number
    chainid: number
    token: string
    address: string
    xrate: number
    isLP: boolean
}

export interface FNFT {
    id: number
    poolid: string
    fnftid: number
    face: number
    usd: number
    chainid: number
    quantity: number
}
export interface FNFTCreation {
    id: string,
    poolId: string,
    fnftId: number,
    isPrincipal: boolean,
    quantityFNFTs: number,
    blockTimestamp: number,
    transactionHash: string
}
export interface FNFTRedeemed {
    id: string,
    poolId: string,
    fnftId: number,
    isPrincipal: boolean,
    quantityFNFTs: number,
    blockTimestamp: number,
    transactionHash: string
}
