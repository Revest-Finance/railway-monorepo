import axios from "axios";
import cron from "node-cron";
import { isE6, resonate_contracts } from "./lib/contracts";
import { ethers, Log } from "ethers";
import { addPool, connect, readPoolIds } from "./lib/db.indexers";
import { poolQuery, PoolQueryResponse } from "./lib/gql";
import { PROVIDERS, SUBGRAPH_URLS } from "./lib/constants";

async function reconcile(chainid: number) {
    console.log("Reconciling db with subgraph");

    const config = {
        method: 'post',
        url: SUBGRAPH_URLS[chainid],
        headers: {
            'Content-Type': 'application/json'
        },
        data: poolQuery
    };
    const res = await axios(config) as PoolQueryResponse
    const graph_pools = res.data.data.poolCreateds;
    const db_pools = await readPoolIds(chainid);
    console.log("Found", graph_pools.length, "pools in subgraph", "Found", db_pools.length, "pools in db");
    const pool_promises: Promise<void>[] = []
    for (const pool of graph_pools) {
        if (!db_pools.includes(pool.poolId)) {
            console.log("Adding pool", pool.poolId, "to db");
            console.log(pool)
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
async function main() {
    if (!process.argv[2]) {
        console.error("Invalid chainid");
        return;
    }
    await connect();
    console.log("Connected to db");
    const chainid = parseInt(process.argv[2]);

    cron.schedule("*/5 * * * * *", async () => {
        await reconcile(chainid);
    });

    const resonate = resonate_contracts[chainid];
    const filter = {
        address: resonate.getAddress(),
        topics: [
            ethers.id("PoolCreated(bytes32,address,address,address,uint128,uint128,uint32,uint256,bool,string,address)"),
        ]
    };
    const iface = new ethers.Interface(
        resonate.interface.fragments
    );
    console.log("Setting up listener for PoolCreated event on chainid", chainid)
    const onPoolCreated = PROVIDERS[chainid].addListener(filter, async (event: Log) => {
        console.log(chainid, "new PoolCreated detected at", await PROVIDERS[chainid].getBlockNumber());
        const logDescription = iface.parseLog(event.toJSON());
        if (!logDescription) {
            console.log("Invalid log description", logDescription);
            return;
        }
        await addPool({
            chainid: chainid,
            poolid: logDescription.args[0],
            payoutasset: logDescription.args[1],
            vault: logDescription.args[2],
            vaultasset: logDescription.args[3],
            rate: logDescription.args[4].toString(),
            addinterestrate: logDescription.args[5].toString(),
            lockupperiod: parseInt(logDescription.args[6].toString()),
            packetsize: logDescription.args[7].toString(),
            packetsizedecimals: isE6(logDescription.args[3], chainid) ? 6 : 18,
            isfixedterm: logDescription.args[8],
            poolname: logDescription.args[9],
            creator: logDescription.args[10],
            packetvolume: "0",
            verifiedby: "",
            ts: (await event.getBlock()).timestamp,
            tx: event.transactionHash
        })
    })

    console.log("Waiting for PoolCreated event...")
    await Promise.all([onPoolCreated]);
}


main().then()