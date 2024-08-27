import { ENVIRONMENT, POSTGRES_URL } from "@resonate/config";
import { delay } from "@resonate/utils";
import { DataSource } from "typeorm";
import { ReduxProcessingEvent, ReduxRequest, StatisticsBalance, StatisticsPercentage, StatisticsUsd } from "./redux";
import { Adapter, EnqueuedEvents, Fnft, Oracle, Pool, Vault, XRate } from "./resonate";

const entities = [
    Adapter,
    Pool,
    Oracle,
    XRate,
    Vault,
    Fnft,
    EnqueuedEvents,
    ReduxRequest,
    ReduxProcessingEvent,
    StatisticsUsd,
    StatisticsBalance,
    StatisticsPercentage,
];

export const resonateDB = new DataSource({
    type: "postgres",
    url: POSTGRES_URL,
    synchronize: ENVIRONMENT === "development",
    logging: false,
    entities: entities,
    migrations: [],
    subscribers: [],
});

export const connectToDatabase = async () => {
    let attempts = 5;

    while (attempts > 0) {
        try {
            await resonateDB.initialize();
            break;
        } catch (error) {
            console.log("STARTUP", `Failed to connect to database. Retrying...`);

            console.log(error);

            attempts--;

            if (attempts === 0) {
                console.log("STARTUP", `Failed to connect to database. Exiting...`, error);

                throw "Failed to connect to database";
            } else {
                await delay(1000);
            }
        }
    }
};

export * from "./redux";
export * from "./resonate";
