import axios from "axios";
import { getBigInt, formatUnits } from "ethers";
import { readPools, updatePoolVolume } from "@resonate/lib/db.indexers";
import { volumeQuery, volumeQueryResponse } from "@resonate/lib/gql";
import { CHAIN_IDS, eth_price, SUBGRAPH_URLS } from "@resonate/lib/constants";
import { Pool } from "@resonate/lib/interfaces";
import { price_provider_contracts } from "@resonate/lib/contracts";

let eth = getBigInt(0);
async function volumeForPool(pool: Pool) {
    console.log(`[${pool.chainid}]`, "Updating volume for", pool.poolid);
    const config = {
        method: "post",
        url: SUBGRAPH_URLS[pool.chainid],
        headers: {
            "Content-Type": "application/json",
        },
        data: volumeQuery(pool.poolid),
    };
    const res = (await axios(config)) as volumeQueryResponse;
    const sumPackets = res.data.data.capitalActivateds.reduce((a, b) => a + parseInt(b.numPackets), 0);

    if (sumPackets === 0) {
        return;
    }

    let lockup_xrate: bigint = getBigInt(0);
    try {
        lockup_xrate = (await price_provider_contracts[pool.chainid].getSafePrice(pool.vaultasset)) as bigint;
    } catch (e) {
        console.log(`[${pool.chainid}]`, "Failed to get price for", pool.vaultasset, "from price provider");
        return;
    }

    let issuerVolume = 0;
    const im1 = getBigInt(sumPackets) * getBigInt(pool.packetsize) * lockup_xrate * eth;
    const im2 = im1 / getBigInt(10) ** getBigInt(18 + pool.packetsizedecimals);
    issuerVolume = parseFloat(im2.toString());

    // console.log(numerator, ' * ', formatUnits(lockup_xrate * eth, 18), ' = $', issuerVolume)
    const purchaserVolume = issuerVolume * parseFloat(formatUnits(getBigInt(pool.rate), 18));
    // console.log(formatUnits(getBigInt(pool.rate), 18), ' is the upfront rate so purchaser volume is', purchaserVolume)

    updatePoolVolume(pool, (issuerVolume + purchaserVolume).toFixed(2));
}

async function reconcile(chainid: number) {
    console.log(`[${chainid}] Reconciling db with subgraph`);

    const pools = await readPools(chainid);

    await Promise.all(pools.map(pool => volumeForPool(pool)));
}

export async function grindPoolVolume() {
    console.log("Grinding pool volume at", new Date().toISOString());

    eth = getBigInt(Math.round(await eth_price()));

    const results = await Promise.allSettled(
        CHAIN_IDS.map(chainid => {
            return reconcile(chainid);
        }),
    );

    for (const result of results) {
        if (result.status === "rejected") {
            console.error(result.reason);
        }
    }

    console.log("Finished grinding pool volume at", new Date().toISOString());
}
