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

const everyTenMinutes = "*/10 * * * *";
const everyHalfHour = "*/30 * * * *";

cron.schedule(everyTenMinutes, grindAdapters);
cron.schedule(everyTenMinutes, grindAPYTVL);
cron.schedule(everyTenMinutes, grindFNFTCalc);
cron.schedule(everyTenMinutes, grindFNFTs);
cron.schedule(everyTenMinutes, grindPools);
cron.schedule(everyHalfHour, grindOracles);
cron.schedule(everyHalfHour, grindPoolTVL);
cron.schedule(everyHalfHour, grindPoolVolume);
