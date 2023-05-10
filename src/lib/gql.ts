export const poolQuery = JSON.stringify({
    query: `query {
        poolCreateds {
            poolId
            asset
            vault
            payoutAsset
            rate
            addInterestRate
            lockupPeriod
            packetSize
            isFixedTerm
            poolName
            creator
            transactionHash
            blockTimestamp
        }
    }`,
    variables: {}
});

export const FnftCreationsQuery = () =>
    JSON.stringify({
        query: `query {
        fnftcreations(
            first: 1000
        ){
            id
            poolId
            fnftId
            isPrincipal
            quantityFNFTs
            blockTimestamp
            transactionHash
        }
    }`,
        variables: {}
    });
export const FnftRedeemsQuery = () =>
    JSON.stringify({
        query: `query {
        fnftredeemeds{
            id
            poolId
            fnftId
            isPrincipal
            quantityFNFTs
            blockTimestamp
            transactionHash
        }
    }`,
        variables: {}
    });

export interface PoolQueryResponse {
    data: {
        data: {
            poolCreateds: PoolCreated[]
        }
    }
}

export interface PoolCreated {
    poolId: string
    payoutAsset: string
    vault: string
    asset: string
    rate: string
    addInterestRate: string
    lockupPeriod: string
    packetSize: string
    packetVolume: string
    isFixedTerm: boolean
    poolName: string
    creator: string
    transactionHash: string
    blockTimestamp: number
}

export const adapterQuery = JSON.stringify({
    query: `query {
        vaultAdapterRegistereds {
            underlyingVault
            vaultAdapter
            vaultAsset
            blockTimestamp
        }
    }`,
    variables: {}
});

export interface AdapterQueryResponse {
    data: {
        data: {
            vaultAdapterRegistereds: AdapterRegistered[]
        }
    }
}

export interface AdapterRegistered {
    underlyingVault: string
    vaultAdapter: string
    vaultAsset: string
    blockTimestamp: number
}

export const oracleQuery = JSON.stringify({
    query: `query {
        setTokenOracles {
            oracle
            token
            blockTimestamp
        }
    }`,
    variables: {}
});

export interface OracleQueryResponse {
    data: {
        data: {
            setTokenOracles: Oracle[]
        }
    }
}

export interface Oracle {
    oracle: string
    token: string
    blockTimestamp: number
}

export const volumeQuery = (poolId: string) => {
    return JSON.stringify({
        query: `query {
          capitalActivateds(where: {poolId: "${poolId}"}) {
              numPackets
          }
      }`,
        variables: {}
    });
}

export interface volumeQueryResponse {
    data: {
        data: {
            capitalActivateds: CapitalActivated[]
        }
    }
}

export interface CapitalActivated {
    numPackets: string
}



