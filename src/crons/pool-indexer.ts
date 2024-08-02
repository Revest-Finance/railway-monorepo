import axios from "axios";
import { isE6 } from "@resonate/lib/contracts";
import { addPool, readPoolIds } from "@resonate/lib/db.indexers";
import { poolQuery, PoolQueryResponse } from "@resonate/lib/gql";
import { CHAIN_IDS, SUBGRAPH_URLS } from "@resonate/lib/constants";

async function reconcile(chainid: number) {
    console.log("Reconciling db with subgraph");

    const config = {
        method: "post",
        url: SUBGRAPH_URLS[chainid],
        headers: {
            "Content-Type": "application/json",
        },
        data: poolQuery,
    };
    const res = (await axios(config)) as PoolQueryResponse;
    const graph_pools = res.data.data.poolCreateds;
    const db_pools = await readPoolIds(chainid);
    console.log("Found", graph_pools.length, "pools in subgraph", "Found", db_pools.length, "pools in db");
    const pool_promises: Promise<void>[] = [];
    for (const pool of graph_pools) {
        if (!db_pools.includes(pool.poolId)) {
            console.log("Adding pool", pool.poolId, "to db");
            console.log(pool);
            try {
                // Due to a bug in the contract, the second item in the pool created event is the payout asset
                // the 4th item is the vault asset, despite what they are labelled.
                await addPool({
                    chainid: chainid,
                    poolid: pool.poolId,
                    payoutasset: pool.asset,
                    vault: pool.vault,
                    vaultasset: pool.payoutAsset,
                    rate: pool.rate,
                    addinterestrate: pool.addInterestRate,
                    lockupperiod: parseInt(pool.lockupPeriod),
                    packetsize: pool.packetSize,
                    packetsizedecimals: isE6(pool.payoutAsset, chainid) ? 6 : 18,
                    isfixedterm: pool.isFixedTerm,
                    poolname: pool.poolName,
                    creator: pool.creator,
                    packetvolume: "0",
                    verifiedby: "",
                    ts: pool.blockTimestamp,
                    tx: pool.transactionHash,
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
