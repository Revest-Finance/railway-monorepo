import { randomUUID } from "crypto";
import { ZeroAddress } from "ethers";
import { ProcessingEvent, ReduxRequest, Transfer, UserProfit } from "./interfaces";

import { connectionPool } from "./db.api";

const insertTransfers = async (transfers: Omit<Transfer, "id">[]) => {
    if (transfers.length === 0) {
        console.log("No transfers to insert.");
        return;
    }

    const client = await connectionPool.connect();
    try {
        for (const transfer of transfers) {
            const { fromAddress, toAddress, amount, blockTimestamp, blockNumber, txHash } = transfer;

            const id = randomUUID();

            const query = {
                text: "INSERT INTO redux_transfers (id, from_address, to_address, amount, block_timestamp, block_number, tx_hash) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                values: [id, fromAddress, toAddress, amount, blockTimestamp, blockNumber, txHash],
            };
            await client.query(query);
        }
        console.log("All transfers have been inserted successfully.");
    } catch (err) {
        console.error("Error inserting transfers:", err);
    } finally {
        client.release();
    }
};

const getDepositTransfers = async (fromAddress: string = ZeroAddress): Promise<Transfer[]> => {
    const client = await connectionPool.connect();
    try {
        const query =
            'SELECT id, from_address AS "fromAddress", to_address AS "toAddress", amount, block_timestamp AS "blockTimestamp", block_number AS "blockNumber", tx_hash AS "txHash" FROM redux_transfers WHERE from_address = $1';
        const values = [fromAddress];
        const res = await client.query(query, values);
        return res.rows;
    } catch (err) {
        console.error("Error fetching deposits:", err);
        throw err;
    } finally {
        client.release();
    }
};

const getLatestBlockNumber = async (): Promise<number> => {
    const query = `
        SELECT block_number as "blockNumber"
        FROM redux_processing_events
        ORDER BY block_timestamp DESC
        LIMIT 1;
    `;

    const client = await connectionPool.connect();
    try {
        const res = await client.query(query);
        return Number(res.rows[0].blockNumber);
    } catch (err) {
        console.error("Error executing query", err);
        return 0;
    } finally {
        client.release();
    }
};

const getRedeemTransfers = async (toAddress: string = ZeroAddress): Promise<Transfer[]> => {
    const client = await connectionPool.connect();
    try {
        const query =
            'SELECT id, from_address AS "fromAddress", to_address AS "toAddress", amount, block_timestamp AS "blockTimestamp", block_number AS "blockNumber", tx_hash AS "txHash" FROM redux_transfers WHERE to_address = $1';
        const values = [toAddress];
        const res = await client.query(query, values);
        return res.rows;
    } catch (err) {
        console.error("Error fetching redeems:", err);
        throw err;
    } finally {
        client.release();
    }
};

const insertProcessingEvents = async (events: Omit<ProcessingEvent, "id">[]) => {
    if (events.length === 0) {
        console.log("No processing events to insert.");
        return;
    }

    const client = await connectionPool.connect();
    try {
        const ids = [];

        for (const event of events) {
            const { totalAssets, ratio, blockNumber, blockTimestamp, txHash } = event;

            ids.push(randomUUID());

            const query = {
                text: "INSERT INTO redux_processing_events (id, total_assets, ratio, block_number, block_timestamp, tx_hash) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (block_number) DO NOTHING",
                values: [ids[ids.length - 1], totalAssets, ratio, blockNumber, blockTimestamp, txHash],
            };
            await client.query(query);
        }
        console.log("All processing events have been inserted successfully.");
    } catch (err) {
        console.error("Error inserting processing events:", err);
    } finally {
        client.release();
    }
};

type ReduxRequestWithShares = Omit<ReduxRequest, "id" | "processingEventId"> & { txHash: string };

const insertRequestsWithShares = async (requests: ReduxRequestWithShares[]) => {
    if (requests.length === 0) {
        console.log("No requests to insert.");
        return;
    }

    const client = await connectionPool.connect();
    try {
        for (const request of requests) {
            const { type, userAddress, assets, txHash } = request;

            const id = randomUUID();

            // Fetch the processing event to get the ratio
            const res = await client.query("SELECT id, ratio FROM redux_processing_events WHERE tx_hash = $1", [
                txHash,
            ]);
            const { ratio, id: processingEventId } = res.rows[0];

            console.log(`Processing event ID: ${processingEventId}, Ratio: ${ratio}`, txHash);

            // Calculate shares
            const shares = assets / ratio;

            // Insert the request with calculated shares
            const query = {
                text: "INSERT INTO redux_requests (id, processing_event_id, type, user_address, shares, assets) VALUES ($1, $2, $3, $4, $5, $6)",
                values: [id, processingEventId, type, userAddress, shares, assets],
            };
            await client.query(query);
        }
        console.log("All requests have been inserted successfully.");
    } catch (err) {
        console.error("Error inserting requests:", err);
    } finally {
        client.release();
    }
};

const getLatestRatio = async (): Promise<number> => {
    const query = `
        SELECT ratio FROM redux_processing_events
        ORDER BY block_timestamp DESC
        LIMIT 1;
    `;

    const client = await connectionPool.connect();
    try {
        const res = await client.query(query);
        return Number(res.rows[0].ratio);
    } catch (err) {
        console.error("Error executing query", err);
        throw err;
    } finally {
        client.release();
    }
};

const getUserProfit = async (userAddress: string): Promise<UserProfit> => {
    const query = `
    WITH redeems AS (
        SELECT SUM(assets) AS total_redeems, SUM((assets) / rpe.ratio) AS total_redeem_shares
        FROM redux_requests rr2
        INNER JOIN redux_processing_events rpe ON rr2.processing_event_id = rpe.id
        WHERE rr2.type = 'RedeemRequestProcessed' AND rr2.user_address = $1
    ),
    deposits AS (
        SELECT SUM(assets) AS total_deposits, SUM(assets / rpe.ratio) AS total_deposit_shares
        FROM redux_requests rr2
        INNER JOIN redux_processing_events rpe ON rr2.processing_event_id = rpe.id
        WHERE rr2.type = 'DepositRequestProcessed' AND rr2.user_address = $1
    ),
    latest_ratio AS (
        SELECT ratio
        FROM redux_processing_events
        ORDER BY block_timestamp DESC
        LIMIT 1
    )
    SELECT 
        (COALESCE(r.total_redeems, 0) - COALESCE(d.total_deposits, 0)) AS "totalAssetProfit",
        (COALESCE(d.total_deposit_shares, 0) - COALESCE(r.total_redeem_shares, 0)) AS "totalShares",
        (COALESCE(d.total_deposit_shares, 0) - COALESCE(r.total_redeem_shares, 0)) * lr.ratio AS "assetValue"
    FROM 
        redeems r, 
        deposits d, 
        latest_ratio lr;
  `;

    const client = await connectionPool.connect();
    try {
        const res = await client.query(query, [userAddress]);
        const { totalAssetProfit, totalShares, assetValue } = res.rows[0];

        const result = {
            totalAssetProfit: Number(totalAssetProfit) + Number(assetValue),
            totalShares: Number(totalShares),
            assetValue: Number(assetValue),
        };

        return {
            totalAssetProfit: Number(result.totalAssetProfit.toFixed(5)),
            totalShares: Number(result.totalShares.toFixed(5)),
            assetValue: Number(result.assetValue.toFixed(5)),
        };
    } catch (err) {
        console.error("Error executing query", err);
        throw err;
    } finally {
        client.release();
    }
};

export {
    insertTransfers,
    getDepositTransfers,
    getRedeemTransfers,
    insertProcessingEvents,
    insertRequestsWithShares,
    getUserProfit,
    getLatestBlockNumber,
    getLatestRatio,
};
