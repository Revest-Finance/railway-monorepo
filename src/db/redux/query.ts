import { resonateDB } from "@resonate/db";
import { UserProfit } from "@resonate/models";
import { ReduxProcessingEvent, StatisticsBalance, StatisticsPercentage, StatisticsUsd } from "./entities";

export const getLatestBlockNumber = async (): Promise<number> => {
    const result = await resonateDB.getRepository(ReduxProcessingEvent).find({
        select: ["blockNumber"],
        order: {
            blockNumber: "DESC",
        },
        take: 1,
    });

    return result.length === 0 ? 0 : result[0].blockNumber;
};

export const getLatestRatio = async (): Promise<number> => {
    const result = await resonateDB.getRepository(ReduxProcessingEvent).find({
        select: ["ratio"],
        order: {
            blockTimestamp: "DESC",
        },
        take: 1,
    });

    return result.length === 0 ? 1 : result[0].ratio;
};

export const getUserProfit = async (userAddress: string): Promise<UserProfit> => {
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

    const entries = await resonateDB.query(query, [userAddress]);

    if (entries.length === 0) {
        return {
            totalAssetProfit: 0,
            totalShares: 0,
            assetValue: 0,
        };
    }

    const { totalAssetProfit, totalShares, assetValue } = entries[0];

    const fixedTotalAssetProfit = (Number(totalAssetProfit) + Number(assetValue)).toFixed(5);
    const fixedTotalShares = Number(totalShares).toFixed(5);
    const fixedAssetValue = Number(assetValue).toFixed(5);

    return {
        totalAssetProfit: Number(fixedTotalAssetProfit),
        totalShares: Number(fixedTotalShares),
        assetValue: Number(fixedAssetValue),
    };
};

export interface ReduxStatistics {
    currentBalance: number;
    usd: {
        timestamp: Date;
        netProfit: number;
        buyAndHoldReturn: number;
        avgWinningTrade: number;
        avgLosingTrade: number;
        largestWinningTrade: number;
        largestLosingTrade: number;
    };
    percentage: {
        timestamp: Date;
        netProfit: number;
        buyAndHoldReturn: number;
        avgWinningTrade: number;
        avgLosingTrade: number;
        largestWinningTrade: number;
        largestLosingTrade: number;
    };
}

export async function getReduxStatistics(): Promise<ReduxStatistics> {
    const statisticsPercentage = await resonateDB.getRepository(StatisticsPercentage).find({
        order: {
            id: "DESC",
        },
        take: 1,
    });

    const statisticsUSD = await resonateDB.getRepository(StatisticsUsd).find({
        order: {
            id: "DESC",
        },
        take: 1,
    });

    const statisticsBalance = await resonateDB.getRepository(StatisticsBalance).find({
        order: {
            id: "DESC",
        },
        take: 1,
    });

    const defaultEntry = {
        timestamp: new Date(),
        netProfit: 0,
        buyAndHoldReturn: 0,
        avgWinningTrade: 0,
        avgLosingTrade: 0,
        largestWinningTrade: 0,
        largestLosingTrade: 0,
    };

    return {
        currentBalance: statisticsBalance.length > 0 ? statisticsBalance[0].balance : 0,
        usd: statisticsUSD.length > 0 ? statisticsUSD[0] : defaultEntry,
        percentage: statisticsPercentage.length > 0 ? statisticsPercentage[0] : defaultEntry,
    };
}
