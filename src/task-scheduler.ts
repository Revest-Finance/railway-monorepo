import cron from "node-cron";
import {
    grindAPYTVL,
    grindFNFTCalc,
    grindFNFTs,
    grindOracles,
    grindPools,
    grindPoolTVL,
    grindPoolVolume,
    grindAdapters,
} from "./crons";
import { grindQueues } from "./crons/queues";
import { connectToDatabase } from "./db/index";

const everyFiveMinutes = "*/5 * * * *";
const everyTenMinutes = "*/10 * * * *";
const everyHalfHour = "*/30 * * * *";

async function main() {
    await connectToDatabase();

    cron.schedule(everyFiveMinutes, grindQueues);
    cron.schedule(everyTenMinutes, grindAPYTVL);
    cron.schedule(everyTenMinutes, grindFNFTCalc);
    cron.schedule(everyTenMinutes, grindFNFTs);
    cron.schedule(everyTenMinutes, grindPools);
    cron.schedule(everyHalfHour, grindAdapters);
    cron.schedule(everyHalfHour, grindOracles);
    cron.schedule(everyHalfHour, grindPoolTVL);
    cron.schedule(everyHalfHour, grindPoolVolume);
}

main();
