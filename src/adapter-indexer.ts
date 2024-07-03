import { addAdapter, connect, readAdapters } from "./lib/db.indexers";
import { adapterQuery, AdapterQueryResponse } from "./lib/gql";
import { CHAIN_IDS, SUBGRAPH_URLS } from "./lib/constants";
import axios from "axios";
import cron from "node-cron";

async function reconcile(chainid: number) {
    console.log(`[${chainid}] Reconciling db with subgraph`);

    const config = {
        method: "post",
        url: SUBGRAPH_URLS[chainid],
        headers: {
            "Content-Type": "application/json",
        },
        data: adapterQuery,
    };
    const res = (await axios(config)) as AdapterQueryResponse;
    const graph_adapters = [...new Set(res.data.data.vaultAdapterRegistereds)];
    const db_adapters = await readAdapters(chainid);
    const distinct_graph_adapters = [...new Set(graph_adapters.map(adapter => adapter.underlyingVault))];
    console.log(
        `[${chainid}]`,
        "Found",
        graph_adapters.length,
        "adapters in subgraph",
        distinct_graph_adapters.length,
        "distinct, Found",
        db_adapters.length,
        "adapters in db",
    );
    for (const adapter of graph_adapters) {
        if (!db_adapters.includes(adapter.vaultAdapter)) {
            await addAdapter({
                chainid: chainid,
                underlyingVault: adapter.underlyingVault,
                vaultAdapter: adapter.vaultAdapter,
                vaultAsset: adapter.vaultAsset,
                ts: adapter.blockTimestamp,
                status: 1,
            });
        }
    }
}
async function main() {
    await connect();
    console.log("Connected to db");

    cron.schedule("0 * * * *", async () => {
        await Promise.all(
            CHAIN_IDS.map(chainid => {
                return reconcile(chainid);
            }),
        );
    });
}

main().then();
