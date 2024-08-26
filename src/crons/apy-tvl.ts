import { yearn } from "../vaults/yearn";
import { beefy } from "../vaults/beefy";
import { reaper } from "../vaults/reaper";
import { rageTrade } from "../vaults/ragetrade";
import { frax } from "../vaults/frax";

export const grindAPYTVL = async () => {
    console.log(`Grinding APY/TVL at ${new Date().toISOString()}`);

    const tasks = [yearn, beefy, reaper, rageTrade, frax];

    const results = await Promise.allSettled(Object.values(tasks).map(task => task()));

    for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (result.status === "rejected") {
            console.error(`Error grinding ${tasks[i].name}: ${result.reason.message}`);
        }
    }

    console.log(`Finished grinding APY/TVL at ${new Date().toISOString()}`);
};
