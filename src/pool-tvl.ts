import cron from "node-cron";
import { CHAIN_IDS, eth_price } from "./lib/constants";
import { batchUpdatePoolTVLs, connect, readPools } from "./lib/db.indexers";
import axios from "axios";
import { PoolAndTvl, QueueState } from "./lib/interfaces";
let eth = 0;

const run = async (chainId: number) => {
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

const main = async () => {
    await connect();
    // This runs once an hour because it is very expensive
    for (const id of CHAIN_IDS) {
        cron.schedule(`*/720 * * * *`, async () => {
            eth = await eth_price();
            run(id);
        });
    }
};

main().then();
