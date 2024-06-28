import cron from "node-cron";
import { connect } from "./lib/db.indexers";
import { yearn } from "./vaults/yearn";
import { beefy } from "./vaults/beefy";
import { reaper } from "./vaults/reaper";
import { rageTrade } from "./vaults/ragetrade";
import { frax } from "./vaults/frax";

const main = async () => {
    await connect();
    cron.schedule(`*/10 * * * * *`, async () => {
        await Promise.all([yearn(), beefy(), reaper(), rageTrade(), frax()]);
    });
};

main().then();
