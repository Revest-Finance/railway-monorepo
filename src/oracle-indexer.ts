import cron from "node-cron";
import axios from "axios";
import { addOracle, connect, readOracles } from "./lib/db";
import { oracleQuery, OracleQueryResponse } from "./lib/gql";
import { CHAIN_IDS, SUBGRAPH_URLS } from "./lib/constants";

async function reconcile(chainid: number) {
    console.log(`[${chainid}] Reconciling db with subgraph`);

    const config = {
        method: 'post',
        url: SUBGRAPH_URLS[chainid],
        headers: {
            'Content-Type': 'application/json'
        },
        data: oracleQuery
    };
    const res = await axios(config) as OracleQueryResponse
    const graph_oracles = [...new Set(res.data.data.setTokenOracles)];
    const db_oracles = await readOracles(chainid);
    const distinct_graph_oracles = [...new Set(graph_oracles.map( oracle => oracle.token ))]
    console.log(`[${chainid}]`, "Found", graph_oracles.length, "oracles in subgraph", distinct_graph_oracles.length, "distinct, Found", db_oracles.length, "oracles in db");
    for (const oracle of graph_oracles) {
        if (!db_oracles.includes(oracle.token)) {
            await addOracle({
                chainid: chainid,
                asset: oracle.token,
                oracle: oracle.oracle,
                ts: oracle.blockTimestamp,
            });
        }
    }
}
async function main() {
    await connect();
    console.log("Connected to db");

    cron.schedule("*/1 * * * *", async () => {
        await Promise.all(CHAIN_IDS.map((chainid) => {
            return reconcile(chainid);
        }))
    });
}


main().then()