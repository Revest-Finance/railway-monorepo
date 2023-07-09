import { Client } from 'pg';
import { Adapter, Oracle, Pool, VaultInfo, XRATE } from './interfaces';


const client = new Client({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: parseInt(process.env.MYSQLPORT!)
})


client.connect()

// add id
export const all_tvl = async () : Promise<number> => {
    const _fnftTotal = await client.query<{ sum: string }>(`SELECT SUM(usd) from fnfts`)
    const _poolTotal = await client.query<{ sum: string }>(`SELECT SUM(tvl) from pools`)

    if (!_fnftTotal.rows[0] || !_poolTotal.rows[0]) {
        return 0
    } else {
        const fnftTotal = parseFloat(_fnftTotal.rows[0].sum.substring(1).replace(",", ""))
        const poolTotal = parseFloat(_poolTotal.rows[0].sum.substring(1).replace(",", ""))
        return Math.floor(fnftTotal + poolTotal)
    }
}

// tvl by chain
export const chain_tvl = async (chainId: number) : Promise<number> => {
    const _fnftTotal = await client.query<{ sum: string }>(`SELECT SUM(usd) from fnfts where chainid = ${chainId}`)
    const _poolTotal = await client.query<{ sum: string }>(`SELECT SUM(tvl) from pools where chainid = ${chainId}`)

    if (!_fnftTotal.rows[0] || !_poolTotal.rows[0]) {
        return 0
    } else {
        const fnftTotal = parseFloat(_fnftTotal.rows[0].sum.substring(1).replace(",", ""))
        const poolTotal = parseFloat(_poolTotal.rows[0].sum.substring(1).replace(",", ""))
        return Math.floor(fnftTotal + poolTotal)
    }
}


export const getVaultInfo = async (address: string, chainid: number) : Promise<VaultInfo | undefined> =>{

    const res = await client.query<VaultInfo>(`SELECT * FROM VAULTS WHERE CHAINID = ${chainid} AND ADDRESS = '${address}' LIMIT 1`)

    return res.rowCount > 0 ? res.rows[0] : undefined
    
}
export const getXrate = async (address: string, chainid: number) : Promise<XRATE | undefined> =>{

    const res = await client.query<XRATE>(`SELECT * FROM xrates WHERE CHAINID = ${chainid} AND ADDRESS = '${address}' LIMIT 1`)

    return res.rowCount > 0 ? res.rows[0] : undefined
    
}
export const getFeaturedPools = async () : Promise<Pool[] | undefined> =>{
    const res = await client.query<Pool>(`SELECT * FROM pools WHERE status = 2`)

    return res.rowCount > 0 ? res.rows : undefined
    
}
export const getDegenPools = async () : Promise<Pool[] | undefined> =>{
    const res = await client.query<Pool>(`SELECT * FROM pools WHERE status = 3`)

    return res.rowCount > 0 ? res.rows : undefined
}
export const getHeroPool = async (chainid: number) : Promise<Pool | undefined> =>{
    const res = await client.query<Pool>(`SELECT * FROM pools WHERE status = 4 and chainid = ${chainid} limit 1`)

    return res.rowCount > 0 ? res.rows[0] : undefined
}
export const getPools = async (chainid: number) : Promise<Pool[] | undefined> =>{
    const res = await client.query<Pool>(`SELECT * FROM pools WHERE CHAINID = ${chainid} and status <> -1`)

    return res.rowCount > 0 ? res.rows : undefined
    
}
export const getPool = async (poolid: string, chainid: number) : Promise<Pool | undefined> =>{
    const res = await client.query<Pool>(`SELECT * FROM pools WHERE CHAINID = ${chainid} and poolid = '${poolid}' limit 1`)

    return res.rowCount > 0 ? res.rows[0] : undefined
    
}
export const isVerified = async (poolid: string, chainid: number) : Promise<string | undefined> =>{
    const res = await client.query<Pool>(`SELECT * FROM pools WHERE CHAINID = ${chainid} AND poolid = '${poolid}' LIMIT 1`)

    return res.rowCount > 0 ? res.rows[0].verifiedby : undefined
    
}

export const isBeefyVault = async (vault: string) : Promise<boolean> =>{
    const res1 = await client.query<VaultInfo>(`SELECT * FROM vaults WHERE address = '${vault}'`)
    if (res1.rowCount == 0) {
        return false
    }
    return res1.rows[0].provider == "Beefy Finance"
}
export const getAdapters = async (chainid: number) : Promise<Adapter[] | undefined> =>{
    const res = await client.query<Adapter>(`SELECT * FROM adapters WHERE CHAINID = ${chainid} and status <> -1`)

    return res.rowCount > 0 ? res.rows : undefined
    
}
export const getOracles = async (chainid: number) : Promise<Oracle[] | undefined> =>{
    const res = await client.query<Oracle>(`SELECT * FROM oracles WHERE CHAINID = ${chainid}`)

    return res.rowCount > 0 ? res.rows : undefined
    
}
export const getPoolByVault = async (vault: string) : Promise<Pool | undefined> =>{
    // require passed vault is a beefy vault
    const res = await client.query<Pool>(`SELECT * FROM pools WHERE vault = '${vault}'`)
    return res.rowCount > 0 ? res.rows[0] : undefined
    
}