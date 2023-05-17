import cron from "node-cron";
import { addFNFT, connect, readAllFNFTS } from "./lib/db.indexers";
import { CHAIN_IDS, SUBGRAPH_URLS } from "./lib/constants";
import axios, { AxiosRequestConfig } from "axios";
import { FnftCreationsQuery, FnftRedeemsQuery } from "./lib/gql";
import { FNFTCreation, FNFTRedeemed } from "./lib/interfaces";

const graphFNFTCreationEvents = async (chainid: number) => {
    const config: AxiosRequestConfig = {
        method: 'post',
        url: SUBGRAPH_URLS[chainid],
        headers: {
            'Content-Type': 'application/json'
        },
        data: FnftCreationsQuery()
    };
    const creations_res = await axios(config)
    const creations = creations_res["data"]["data"]["fnftcreations"] as FNFTCreation[] 
    config.data = FnftRedeemsQuery()
    const redeems_res = await axios(config)
    const redeems = redeems_res["data"]["data"]["fnftredeemeds"] as FNFTRedeemed[]
    const diff = creations.filter((creation) => !redeems.find((redeem) => redeem.fnftId === creation.fnftId))
    return diff
}


async function reconcile(chainid: number) {
    const graph_fnfts = await graphFNFTCreationEvents(chainid);
    const db_fnfts = await readAllFNFTS(chainid);
    console.log(`[${chainid}] Reconciling db with subgraph, graph:`, graph_fnfts.length, "db:", db_fnfts.length);
    for (const graph_fnft of graph_fnfts) {
        if (!db_fnfts.find( (fnft) => fnft.fnftid == graph_fnft.fnftId)) {
            await addFNFT(graph_fnft.poolId, graph_fnft.fnftId, graph_fnft.quantityFNFTs, 0, 0, chainid);
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