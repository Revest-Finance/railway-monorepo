import { randomUUID } from "crypto";
import { ProcessingEvent, ReduxRequest, ReduxStatisticsRequest } from "@resonate/models";

import { resonateDB } from "@resonate/db";
import {
    ReduxProcessingEvent,
    ReduxRequest as ReduxRequestEntity,
    StatisticsBalance,
    StatisticsPercentage,
    StatisticsUsd,
} from "./entities";

export async function insertProcessingEvents(events: Omit<ProcessingEvent, "id">[]) {
    if (events.length === 0) {
        console.log("No processing events to insert.");
        return;
    }

    const eventsWithIds = events.map(event => ({
        ...event,
        id: randomUUID(),
    }));

    await resonateDB.getRepository(ReduxProcessingEvent).save(eventsWithIds);
}

type ReduxRequestWithShares = Omit<ReduxRequest, "id" | "processingEventId"> & { txHash: string };

export async function insertRequestsWithShares(requests: ReduxRequestWithShares[]) {
    if (requests.length === 0) {
        console.log("No requests to insert.");
        return;
    }

    const entries = [];

    for (const request of requests) {
        const { type, userAddress, assets, txHash } = request;

        const mainProcessingEvent = await resonateDB.getRepository(ReduxProcessingEvent).findOne({
            where: {
                txHash,
            },
        });

        if (!mainProcessingEvent) {
            throw new Error(`Processing event with txHash ${txHash} not found.`);
        }

        const { ratio, id: processingEventId } = mainProcessingEvent;

        console.log(`Processing event ID: ${processingEventId}, Ratio: ${ratio}`, txHash);

        // Calculate shares
        const shares = assets / ratio;

        entries.push({
            id: randomUUID(),
            processingEventId,
            type,
            userAddress,
            shares,
            assets,
        });
    }

    await resonateDB.getRepository(ReduxRequestEntity).save(entries);
}

export async function updateReduxStatistics(request: ReduxStatisticsRequest) {
    await Promise.all([
        resonateDB.getRepository(StatisticsUsd).insert({
            ...request.usd,
            timestamp: new Date(),
        }),
        resonateDB.getRepository(StatisticsPercentage).insert({
            ...request.percentage,
            timestamp: new Date(),
        }),
        resonateDB.getRepository(StatisticsBalance).insert({
            balance: request.currentBalance,
            timestamp: new Date(),
        }),
    ]);
}
