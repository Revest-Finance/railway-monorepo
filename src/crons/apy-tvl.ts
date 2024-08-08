import { yearn } from "../vaults/yearn";
import { beefy } from "../vaults/beefy";
import { reaper } from "../vaults/reaper";
import { rageTrade } from "../vaults/ragetrade";
import { frax } from "../vaults/frax";

export const grindAPYTVL = async () => {
    console.log(`Grinding APY/TVL at ${new Date().toISOString()}`);
    const results = await Promise.allSettled([yearn(), beefy(), reaper(), rageTrade(), frax()]);

    for (const result of results) {
        if (result.status === "rejected") {
            console.error(result.reason);
        }
    }

    console.log(`Finished grinding APY/TVL at ${new Date().toISOString()}`);
};
