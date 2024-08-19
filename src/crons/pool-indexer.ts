import { isE6 } from "@resonate/lib/contracts";

import { CHAIN_IDS } from "@resonate/lib/constants";
import { readPoolIds, addPool } from "@resonate/db";
import { getPoolCreations } from "@resonate/lib/eth.api";

async function reconcile(chainId: number) {
    const db_pools = await readPoolIds(chainId);
    const chainPools = await getPoolCreations(chainId);

    console.log("Found", chainPools.length, "pools in subgraph", "Found", db_pools.length, "pools in db");

    const pool_promises: Promise<void>[] = [];
    for (const pool of chainPools) {
        if (!db_pools.includes(pool.poolId)) {
            console.log("Adding pool", pool.poolId, "to db");
            try {
                await addPool({
                    ...pool,
                    packetSizeDecimals: isE6(pool.payoutAsset, chainId) ? 6 : 18,
                    verifiedBy: "",
                });
            } catch (e) {
                console.error("Error adding pool", pool.poolId, "to db", e);
            }
        }
    }
    await Promise.all(pool_promises);
}

export async function grindPools() {
    console.log("Grinding pools at", new Date().toISOString());

    const results = await Promise.allSettled(CHAIN_IDS.map(chainId => reconcile(chainId)));

    for (const result of results) {
        if (result.status === "rejected") {
            console.error(result.reason);
        }
    }

    console.log("Finished grinding pools at", new Date().toISOString());
}
