import { CHAIN_IDS, eth_price } from "@resonate/lib/constants";
import { readPools, updatePoolTVL } from "@resonate/db";
import { getPoolQueues } from "@resonate/lib/service";

let eth = 0;
const reconcile = async (chainId: number) => {
    console.log("Running pool tvl indexer for chainId", chainId);
    const pools = await readPools(chainId);

    const requests = pools.map(async pool => {
        try {
            const queueState = await getPoolQueues(chainId, pool.poolId);

            const tvl = queueState.totalUsd;

            if (tvl > 0) {
                await updatePoolTVL(chainId, pool.poolId, String(tvl));
            }
        } catch (e) {
            return new Promise((_, reject) => reject(e));
        }
    });

    await Promise.all(requests);
};

export const grindPoolTVL = async () => {
    console.log("Grinding pool tvls at", new Date().toISOString());

    eth = await eth_price();
    const results = await Promise.allSettled(CHAIN_IDS.map(id => reconcile(id)));

    for (const result of results) {
        if (result.status === "rejected") {
            console.error(result.reason);
        }
    }

    console.log("Finished grinding pool tvls at", new Date().toISOString());
};
