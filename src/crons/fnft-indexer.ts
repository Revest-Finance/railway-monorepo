import { CHAIN_IDS } from "@resonate/lib/constants";
import { addFNFT, readAllFNFTS } from "@resonate/db";
import { getFNFTCreations, getFNFTRedeems } from "@resonate/lib/eth.api";

const graphFNFTCreationEvents = async (chainId: number) => {
    const creations = await getFNFTCreations(chainId);
    const redeemEvents = await getFNFTRedeems(chainId);

    const redeems = redeemEvents.map((redeem: any) => ({
        ...redeem,
        quantityFNFTs: -parseInt(redeem.quantityFNFTs),
    }));

    const allEvents = [...creations, ...redeems];

    const allFNFTs = allEvents.reduce((acc: any, event: any) => {
        if (!acc[event.fnftId]) {
            acc[event.fnftId] = event;
        } else {
            acc[event.fnftId].quantityFNFTs += event.quantityFNFTs;
        }
        return acc;
    }, {});

    return allFNFTs.filter((creation: any) => creation.quantityFNFTs > 0);
};

async function reconcile(chainId: number) {
    const graph_fnfts = await graphFNFTCreationEvents(chainId);
    const db_fnfts = await readAllFNFTS(chainId);

    console.log(`[${chainId}] Reconciling db with subgraph, graph:`, graph_fnfts.length, "db:", db_fnfts.length);
    for (const graph_fnft of graph_fnfts) {
        if (!db_fnfts.find(fnft => fnft.fnftId == graph_fnft.fnftId)) {
            await addFNFT({
                chainId,
                fnftId: graph_fnft.fnftId,
                poolId: graph_fnft.poolId,
                quantity: graph_fnft.quantityFNFTs,
                face: 0,
                usd: "0",
            });
        }
    }
}

export async function grindFNFTs() {
    console.log("Grinding FNFTs at", new Date().toISOString());

    const result = await Promise.allSettled(
        CHAIN_IDS.map(chainid => {
            return reconcile(chainid);
        }),
    );

    for (const res of result) {
        if (res.status === "rejected") {
            console.error(res.reason);
        }
    }

    console.log("Finished grinding FNFTs at", new Date().toISOString());
}
