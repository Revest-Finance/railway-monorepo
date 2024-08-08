import axios from "axios";
import { CHAIN_IDS, eth_price } from "@resonate/lib/constants";
import { batchUpdatePoolTVLs, readPools } from "@resonate/lib/db.indexers";
import { PoolAndTvl, QueueState } from "@resonate/lib/interfaces";

let eth = 0;
const reconcile = async (chainId: number) => {
    console.log("Running pool tvl indexer for chainId", chainId);
    /**
     * Need all pools and the exchange rate for each asset
     */
    const pools = await readPools(chainId);
    /**
     * Need the queue state for each pool
     */
    const tvls: { [poolid: string]: number } = {};
    await Promise.all(
        pools.map(async pool => {
            try {
                const res = await axios.get(
                    `https://app.resonate.finance/api/get-queue-state?chainId=${pool.chainid}&&poolId=${pool.poolid}`,
                );
                const queueState = res.data as QueueState;
                tvls[pool.poolid] = queueState.totalUsd;
            } catch (e) {
                console.log(`[${pool.poolid}] ${e}`);
                return;
            }
        }),
    );
    console.table(tvls);
    const updatablePools = pools
        .filter(pool => tvls[pool.poolid] > 0)
        .map((pool): PoolAndTvl => {
            return { ...pool, tvl: tvls[pool.poolid] };
        });
    console.log(`${chainId} updatable pools = ${updatablePools.length}`);
    await batchUpdatePoolTVLs(updatablePools);
};

export const grindPoolTVL = async () => {
    console.log("Grinding pool tvls at", new Date().toISOString());
    // This runs once an hour because it is very expensive

    eth = await eth_price();
    const results = await Promise.allSettled(CHAIN_IDS.map(id => reconcile(id)));

    for (const result of results) {
        if (result.status === "rejected") {
            console.error(result.reason);
        }
    }

    console.log("Finished grinding pool tvls at", new Date().toISOString());
};
