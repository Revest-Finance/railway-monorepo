import { Pool as PgPool } from "pg";
import { MYSQLDATABASE, MYSQLHOST, MYSQLPASSWORD, MYSQLPORT, MYSQLUSER } from "../config";
import { Adapter, Oracle, Pool, VaultInfo, XRATE } from "./interfaces";
import { ReduxPerformanceEntry, ReduxStatisticsRequest } from "./redux";

export const connectionPool = new PgPool({
    host: MYSQLHOST,
    user: MYSQLUSER,
    password: MYSQLPASSWORD,
    database: MYSQLDATABASE,
    port: MYSQLPORT,
});

// add id
export const all_tvl = async (): Promise<number> => {
    const client = await connectionPool.connect();

    const _fnftTotal = await client.query<{ sum: string }>(`SELECT SUM(usd) from fnfts`);
    const _poolTotal = await client.query<{ sum: string }>(`SELECT SUM(tvl) from pools`);

    client.release();

    if (!_fnftTotal.rows[0] || !_poolTotal.rows[0]) {
        return 0;
    } else {
        const fnftTotal = parseFloat(_fnftTotal.rows[0].sum.substring(1).replace(",", ""));
        const poolTotal = parseFloat(_poolTotal.rows[0].sum.substring(1).replace(",", ""));
        return Math.floor(fnftTotal + poolTotal);
    }
};

// tvl by chain
export const chain_tvl = async (chainId: number): Promise<number> => {
    if (typeof chainId !== "number") {
        return 0;
    }

    const client = await connectionPool.connect();

    const _chainTvl = await client.query<{ total: string }>(
        `SELECT 
          (SELECT SUM(usd::numeric) FROM fnfts WHERE chainid = ${chainId}) +
          (SELECT SUM(tvl::numeric) FROM pools WHERE chainid = ${chainId}) AS total`,
    );

    client.release();

    return Math.floor(parseFloat(_chainTvl.rows[0].total));
};

export const getVaultInfo = async (address: string, chainid: number): Promise<VaultInfo | undefined> => {
    const client = await connectionPool.connect();

    const res = await client.query<VaultInfo>(
        `SELECT * FROM VAULTS WHERE CHAINID = ${chainid} AND ADDRESS = '${address}' LIMIT 1`,
    );

    client.release();

    return res.rowCount > 0 ? res.rows[0] : undefined;
};
export const getXrate = async (address: string, chainid: number): Promise<XRATE | undefined> => {
    const client = await connectionPool.connect();

    const res = await client.query<XRATE>(
        `SELECT * FROM xrates WHERE CHAINID = ${chainid} AND ADDRESS = '${address}' LIMIT 1`,
    );

    client.release();

    return res.rowCount > 0 ? res.rows[0] : undefined;
};
export const getFeaturedPools = async (): Promise<Pool[] | undefined> => {
    const client = await connectionPool.connect();

    const res = await client.query<Pool>(`SELECT * FROM pools WHERE status = 2`);

    client.release();

    return res.rowCount > 0 ? res.rows : undefined;
};
export const getDegenPools = async (): Promise<Pool[] | undefined> => {
    const client = await connectionPool.connect();

    const res = await client.query<Pool>(`SELECT * FROM pools WHERE status = 3`);

    client.release();

    return res.rowCount > 0 ? res.rows : undefined;
};
export const getHeroPool = async (chainid: number): Promise<Pool | undefined> => {
    const client = await connectionPool.connect();

    const res = await client.query<Pool>(`SELECT * FROM pools WHERE status = 4 and chainid = ${chainid} limit 1`);

    client.release();

    return res.rowCount > 0 ? res.rows[0] : undefined;
};
export const getPools = async (chainid: number): Promise<Pool[] | undefined> => {
    const client = await connectionPool.connect();

    const res = await client.query<Pool>(`SELECT * FROM pools WHERE CHAINID = ${chainid} and status <> -1`);

    client.release();

    return res.rowCount > 0 ? res.rows : undefined;
};
export const getPool = async (poolid: string, chainid: number): Promise<Pool | undefined> => {
    const client = await connectionPool.connect();

    const res = await client.query<Pool>(
        `SELECT * FROM pools WHERE CHAINID = ${chainid} and poolid = '${poolid}' limit 1`,
    );

    client.release();

    return res.rowCount > 0 ? res.rows[0] : undefined;
};
export const isVerified = async (poolid: string, chainid: number): Promise<string | undefined> => {
    const client = await connectionPool.connect();

    const res = await client.query<Pool>(
        `SELECT * FROM pools WHERE CHAINID = ${chainid} AND poolid = '${poolid}' LIMIT 1`,
    );

    client.release();

    return res.rowCount > 0 ? res.rows[0].verifiedby : undefined;
};

export const isBeefyVault = async (vault: string): Promise<boolean> => {
    const client = await connectionPool.connect();

    const res1 = await client.query<VaultInfo>(`SELECT * FROM vaults WHERE address = '${vault}'`);
    if (res1.rowCount == 0) {
        return false;
    }

    client.release();

    return res1.rows[0].provider == "Beefy Finance";
};
export const getAdapters = async (chainid: number): Promise<Adapter[] | undefined> => {
    const client = await connectionPool.connect();

    const res = await client.query<Adapter>(`SELECT * FROM adapters WHERE CHAINID = ${chainid} and status <> -1`);

    client.release();

    return res.rowCount > 0 ? res.rows : undefined;
};
export const getOracles = async (chainid: number): Promise<Oracle[] | undefined> => {
    const client = await connectionPool.connect();

    const res = await client.query<Oracle>(`SELECT * FROM oracles WHERE CHAINID = ${chainid}`);

    client.release();

    return res.rowCount > 0 ? res.rows : undefined;
};
export const getPoolByVault = async (vault: string): Promise<Pool | undefined> => {
    const client = await connectionPool.connect();

    // require passed vault is a beefy vault
    const res = await client.query<Pool>(`SELECT * FROM pools WHERE vault = '${vault}'`);

    client.release();

    return res.rowCount > 0 ? res.rows[0] : undefined;
};

export const updateReduxStatistics = async (request: ReduxStatisticsRequest) => {
    const client = await connectionPool.connect();

    await client.query(
        `INSERT INTO statistics_percentage (timestamp, net_profit, buy_and_hold_return, avg_winning_trade, avg_losing_trade, largest_winning_trade, largest_losing_trade) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            new Date(),
            request.percentage.netProfit,
            request.percentage.buyAndHoldReturn,
            request.percentage.avgWinningTrade,
            request.percentage.avgLosingTrade,
            request.percentage.largestWinningTrade,
            request.percentage.largestLosingTrade,
        ],
    );
    await client.query(
        `INSERT INTO statistics_usd (timestamp, net_profit, buy_and_hold_return, avg_winning_trade, avg_losing_trade, largest_winning_trade, largest_losing_trade) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            new Date(),
            request.usd.netProfit,
            request.usd.buyAndHoldReturn,
            request.usd.avgWinningTrade,
            request.usd.avgLosingTrade,
            request.usd.largestWinningTrade,
            request.usd.largestLosingTrade,
        ],
    );
    await client.query(`INSERT INTO statistics_balance (timestamp, balance) VALUES ($1, $2)`, [
        new Date(),
        request.currentBalance,
    ]);

    client.release();
};

function convertStringsToNumbers(res: any) {
    return res.rows.map((row: any) => {
        const newRow: any = {};
        for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
                newRow[key] = isNaN(row[key].toString()) ? row[key] : parseFloat(row[key]);
            }
        }
        return newRow;
    });
}

export const getReduxStatistics = async () => {
    const client = await connectionPool.connect();

    const res = await client.query<ReduxPerformanceEntry>(
        `SELECT * FROM statistics_percentage ORDER BY id DESC LIMIT 1`,
    );
    const res2 = await client.query<ReduxPerformanceEntry>(`SELECT * FROM statistics_usd ORDER BY id DESC LIMIT 1`);
    const res3 = await client.query<{ balance: number }>(
        `SELECT balance FROM statistics_balance ORDER BY id DESC LIMIT 1`,
    );

    client.release();

    const defaultEntry = {
        timestamp: new Date().toISOString(),
        netProfit: 0,
        buyAndHoldReturn: 0,
        avgWinningTrade: 0,
        avgLosingTrade: 0,
        largestWinningTrade: 0,
        largestLosingTrade: 0,
    };

    return {
        currentBalance: res3.rowCount > 0 ? Number(res3.rows[0].balance) : 0,
        usd: res2.rowCount > 0 ? convertStringsToNumbers(res2)[0] : defaultEntry,
        percentage: res.rowCount > 0 ? convertStringsToNumbers(res)[0] : defaultEntry,
    };
};
