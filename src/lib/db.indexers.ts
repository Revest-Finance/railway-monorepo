import { Client } from "pg";
import { MYSQLDATABASE, MYSQLHOST, MYSQLPASSWORD, MYSQLPORT, MYSQLUSER } from "../config";
import { Adapter, Pool, Oracle, FNFT, VaultInfo, PoolAndTvl } from "./interfaces";

const client = new Client("postgres://user:very_good_password@localhost:5432/resonate");

client.connect();

/*/////////////////////////////////////////////
                ADD FUNCTIONS
/////////////////////////////////////////////*/

// Add Pool to DB
export const addPool = async (pool: Pool) => {
    // check if id alr exists
    console.log("here");
    let res;
    try {
        res = await client.query(`SELECT * FROM POOLS WHERE poolid = '${pool.poolid}' AND chainId = ${pool.chainid}`);
    } catch (e) {
        console.error(e);
    }
    console.log("res", res);
    if (res && res.rowCount == 0) {
        const sql = `CALL AddPool(${pool.chainid}, '${pool.poolid}', '${pool.payoutasset}', '${pool.vault}', '${
            pool.vaultasset
        }', '${pool.rate}', '${pool.addinterestrate}', '${pool.lockupperiod}', '${pool.packetsize}', ${
            pool.packetsizedecimals
        }, ${pool.isfixedterm}, '${pool.poolname.replace(/'/g, "").replace(/;/g, "")}', '${pool.creator}', ${
            pool.ts
        }, '${pool.tx}')`;
        await client.query(sql);
        console.log(`[${pool.chainid}] PoolID = ${pool.poolid} added`);
    } else {
        console.log(`[${pool.chainid}] PoolID = ${pool.poolid} alr exists`);
    }
};

// Add Adapter to DB
export const addAdapter = async (adapter: Adapter) => {
    // check if id alr exists
    const res = await client.query<Adapter>(
        `SELECT * FROM ADAPTERS WHERE vault = '${adapter.underlyingVault}' AND chainId = ${adapter.chainid} LIMIT 1`,
    );
    if (res.rowCount == 0) {
        const sql = `CALL addadapter(${adapter.chainid}, '${adapter.underlyingVault}', '${adapter.vaultAdapter}', '${adapter.vaultAsset}', 1, ${adapter.ts})`;
        await client.query(sql);
        console.log(`[${adapter.chainid}] adapter = ${adapter.vaultAdapter} added`);
    } else if (res.rowCount == 1) {
        if (adapter.vaultAdapter != res.rows[0].vaultAdapter) {
            if (adapter.ts > res.rows[0].ts) {
                const sql = `UPDATE ADAPTERS 
                    SET 
                    adapter = '${adapter.vaultAdapter}',
                    ts = ${adapter.ts},
                    asset = '${adapter.vaultAsset}'
                    WHERE vault = '${adapter.underlyingVault}' and chainid = ${adapter.chainid}
                    `;
                await client.query(sql);
                console.log(
                    `[${adapter.chainid}] vault = ${adapter.underlyingVault} updated to adapter = ${adapter.vaultAdapter}`,
                );
            } else {
                console.log(`[${adapter.chainid}] vault = ${adapter.underlyingVault} has already been replaced`);
            }
        }
    }
};
// Add Oracle to DB
export const addOracle = async (oracle: Oracle) => {
    // check if id alr exists
    const res = await client.query<Oracle>(
        `SELECT * FROM ORACLES WHERE asset = '${oracle.asset}' AND chainId = ${oracle.chainid} LIMIT 1`,
    );
    if (res.rowCount == 0) {
        const sql = `CALL addoracle(${oracle.chainid}, '${oracle.asset}', '${oracle.oracle}', ${oracle.ts})`;
        await client.query(sql);
        console.log(`[${oracle.chainid}] oracle = ${oracle.asset} added`);
    } else if (res.rowCount == 1) {
        if (oracle.oracle != res.rows[0].oracle) {
            if (oracle.ts > res.rows[0].ts) {
                const sql = `UPDATE ORACLES 
                    SET 
                    oracle = '${oracle.oracle}',
                    ts = ${oracle.ts}
                    WHERE asset = '${oracle.asset}' and chainid = ${oracle.chainid}
                    `;
                await client.query(sql);
                console.log(`[${oracle.chainid}] asset = ${oracle.asset} updated to oracle = ${oracle.oracle}`);
            } else {
                console.log(`[${oracle.chainid}] asset = ${oracle.asset} oracle has already been replaced`);
            }
        }
    }
};
// add FNFT to DB
export const addFNFT = async (
    poolId: string,
    fnftId: number,
    quantity: number,
    face: number,
    usd: number,
    chainId: number,
) => {
    // check if id alr exists
    let res = await client.query(
        `SELECT * FROM FNFTS WHERE fnftId = ${fnftId} AND poolId = '${poolId}' AND chainId = ${chainId}`,
    );
    if (res.rowCount == 0) {
        res = await client.query(
            `INSERT INTO FNFTS (chainid, poolId, fnftId, face, quantity, usd) VALUES (${chainId}, '${poolId}', ${fnftId}, ${face}, ${quantity}, ${usd})`,
        );
        console.log(`[${chainId}] ID = ${fnftId} added`);
    } else {
        console.log(`[${chainId}] ID = ${fnftId} alr exists`);
    }
};

/*/////////////////////////////////////////////
                READ ALL FUNCTIONS
/////////////////////////////////////////////*/

// Read all pool ids from chainid
export const readPoolIds = async (chainId: number) => {
    const res = await client.query<{ poolid: string }>(`SELECT poolid FROM POOLS WHERE chainId = ${chainId}`);
    return res.rows.map(row => row.poolid);
};
// Read all pools from chainid
export const readPools = async (chainId: number) => {
    const res = await client.query<Pool>(`SELECT * FROM POOLS WHERE chainId = ${chainId}`);
    return res.rows;
};
// Read all adapters from chainid
export const readAdapters = async (chainId: number) => {
    const res = await client.query<{ vault: string }>(`SELECT adapter FROM adapters WHERE chainId = ${chainId}`);
    return res.rows.map(row => row.vault);
};
// Read all oracles from chainid
export const readOracles = async (chainId: number) => {
    const res = await client.query<{ asset: string }>(`SELECT asset FROM oracles WHERE chainId = ${chainId}`);
    return res.rows.map(row => row.asset);
};
export const readAllFNFTS = async (chainId: number): Promise<FNFT[]> => {
    // check if id alr exists
    const q = `SELECT * FROM FNFTS where chainid = ${chainId}`;
    const res = await client.query<FNFT>(q);
    return res.rows;
};
// add id
export const readVaultsFromProvider = async (provider: string): Promise<VaultInfo[] | undefined> => {
    // check if id alr exists

    const res = await client.query<VaultInfo>(`SELECT * FROM vaults where provider = '${provider}'`);
    return res.rows;
};

/*/////////////////////////////////////////////
                UPDATE FUNCTIONS
/////////////////////////////////////////////*/

export const updatePoolVolume = async (pool: Pool, volume: string) => {
    const prev_volume_res = await client.query<{ usdvolume: string }>(
        `SELECT usdvolume from pools WHERE poolid = '${pool.poolid}' AND chainid = ${pool.chainid}`,
    );
    if (prev_volume_res.rowCount > 0) {
        const prev_volume = prev_volume_res.rows[0].usdvolume.slice(1).replace(/,/g, "");
        console.log(`[${pool.chainid}] pool = ${pool.poolid} prev_volume = ${prev_volume} volume = ${volume}`);
        if (volume != prev_volume && volume != "0") {
            await client.query(
                `UPDATE pools SET usdvolume = '${volume}' WHERE poolid = '${pool.poolid}' AND chainid = ${pool.chainid}`,
            );
            console.log(`[${pool.chainid}] pool = ${pool.poolid} updated volumeUSD = ${volume}`);
        }
    }
};
export const batchUpdatePoolTVLs = async (pools: PoolAndTvl[]) => {
    let sql = "";
    for (const pool of pools) {
        if (pool.tvl == 0) {
            console.log("skipping", pool.poolid, pool.poolname);
            continue;
        }
        sql += `UPDATE POOLS SET TVL = ${pool.tvl} WHERE POOLID = '${pool.poolid}' AND CHAINID = ${pool.chainid}; `;
    }
    return await client.query(sql);
};
export const batchUpdateFNFTs = async (fnfts: FNFT[]) => {
    let sql = "";
    for (const fnft of fnfts) {
        if (fnft.usd == 0 || fnft.face == 0) {
            console.log("skipping", fnft.fnftid, fnft.usd, fnft.face);
            continue;
        }
        sql += `UPDATE FNFTS SET USD = ${fnft.usd}, FACE = ${fnft.face} WHERE FNFTID = ${fnft.fnftid} AND CHAINID = ${fnft.chainid}; `;
    }
    return await client.query(sql);
};
export const updateVault = async (vault: VaultInfo) => {
    // update vault
    // check if vault alr exists
    const sql1 = `SELECT * FROM vaults WHERE chainid = '${vault.chainid}' and address = '${vault.address}'`;
    let res = await client.query<VaultInfo>(sql1);
    if (res.rowCount > 0) {
        const old_apy = res.rows[0].apy.toFixed(5);
        const new_apy = vault.apy.toFixed(5);
        const old_tvl = res.rows[0].tvl.slice(1).replace(/,/g, "");
        const new_tvl = vault.tvl;
        if (old_apy == new_apy && old_tvl == new_tvl) {
            console.log(`[${vault.chainid}] [${vault.symbol}] skip\t`, old_apy, new_apy, old_tvl, new_tvl);
        } else {
            console.log(`[${vault.chainid}] [${vault.symbol}] UPDATE\t`, old_apy, new_apy, old_tvl, new_tvl);
            const sql2 = `UPDATE vaults SET apy = ${vault.apy}, tvl = ${vault.tvl} WHERE address = '${vault.address}'`;
            res = await client.query(sql2);
        }
    }
};
/*/////////////////////////////////////////////
                REMOVE FUNCTIONS
/////////////////////////////////////////////*/

// remove id
export const removeId = async (poolId: string, fnftId: number, chainId: number) => {
    // check if id alr exists

    let res = await client.query(
        `SELECT * FROM FNFTS WHERE fnftId = ${fnftId} AND poolId = '${poolId}' AND chainId = ${chainId}`,
    );
    if (res.rowCount > 0) {
        res = await client.query(
            `DELETE FROM FNFTS WHERE poolId = '${poolId}' and fnftId = ${fnftId} and chainId = ${chainId}`,
        );
        console.log(`[${chainId}] ID = ${fnftId} removed`);
    } else {
        console.log(`[${chainId}] ID = ${fnftId} doesn't exist`);
    }
};
