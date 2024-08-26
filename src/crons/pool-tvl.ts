import axios from "axios";
import { CHAIN_IDS, eth_price } from "@resonate/lib/constants";
import { readPools, updatePoolTVL } from "@resonate/db";
import { QueueState } from "@resonate/models";

let eth = 0;
const reconcile = async (chainId: number) => {
    console.log("Running pool tvl indexer for chainId", chainId);
    const pools = await readPools(chainId);

    const requests = pools.map(async pool => {
        try {
            const result = await axios.get(
                `https://app.resonate.finance/api/get-queue-state?chainId=${pool.chainId}&&poolId=${pool.poolId}`,
            );
            const queueState = result.data as QueueState;

            const tvl = queueState.totalUsd;

            if (tvl > 0) {
                await updatePoolTVL(chainId, pool.poolId, String(tvl));
            }
        } catch (e) {
            console.log(`[${pool.poolId}] ${e}`);
            return;
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
