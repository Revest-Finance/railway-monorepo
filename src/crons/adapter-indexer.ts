import { addAdapter, readAdapters } from "@resonate/lib/db.indexers";
import { adapterQuery, AdapterQueryResponse } from "@resonate/lib/gql";
import { CHAIN_IDS, SUBGRAPH_URLS } from "@resonate/lib/constants";
import axios from "axios";

// Every minute
async function indexAdaptersByChain(chainId: number) {
    console.log(`[${chainId}] Reconciling db with subgraph`);

    const config = {
        method: "post",
        url: SUBGRAPH_URLS[chainId],
        headers: {
            "Content-Type": "application/json",
        },
        data: adapterQuery,
    };
    const res = (await axios(config)) as AdapterQueryResponse;
    const graph_adapters = [...new Set(res.data.data.vaultAdapterRegistereds)];
    const db_adapters = await readAdapters(chainId);
    const distinct_graph_adapters = [...new Set(graph_adapters.map(adapter => adapter.underlyingVault))];
    console.log(
        `[${chainId}]`,
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
                chainid: chainId,
                underlyingVault: adapter.underlyingVault,
                vaultAdapter: adapter.vaultAdapter,
                vaultAsset: adapter.vaultAsset,
                ts: adapter.blockTimestamp,
                status: 1,
            });
        }
    }
}

export async function grindAdapters() {
    console.log("Grinding adapters at", new Date().toISOString());

    const results = await Promise.allSettled(
        CHAIN_IDS.map(chainid => {
            return indexAdaptersByChain(chainid);
        }),
    );

    for (const result of results) {
        if (result.status === "rejected") {
            console.error(result.reason);
        }
    }

    console.log("Finished grinding adapters at", new Date().toISOString());
}
