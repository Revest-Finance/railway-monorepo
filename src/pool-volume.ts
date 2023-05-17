import cron from "node-cron";
import axios from "axios";
import { connect, readPools, updatePoolVolume } from "./lib/db.indexers";
import { volumeQuery, volumeQueryResponse } from "./lib/gql";
import { CHAIN_IDS, eth_price, SUBGRAPH_URLS } from "./lib/constants";
import { Pool } from "./lib/interfaces";
import { getBigInt, formatUnits } from "ethers";
import { price_provider_contracts } from "./lib/contracts";

let eth = getBigInt(0)
async function volumeForPool(pool: Pool) {
    console.log(`[${pool.chainid}]`, "Updating volume for", pool.poolid)
    const config = {
        method: 'post',
        url: SUBGRAPH_URLS[pool.chainid],
        headers: {
            'Content-Type': 'application/json'
        },
        data: volumeQuery(pool.poolid)
    };
    const res = await axios(config) as volumeQueryResponse
    const sumPackets = res.data.data.capitalActivateds.reduce((a, b) => a + parseInt(b.numPackets), 0)

    if (sumPackets === 0) {
        // console.log(`[${pool.chainid}]`, "No packets")
        return;
    }


    let lockup_xrate: bigint = getBigInt(0)
    // let payout_xrate: bigint = getBigInt(0)
    try {
        lockup_xrate = await price_provider_contracts[pool.chainid].getSafePrice(pool.vaultasset) as bigint
    } catch (e) {
        console.log(`[${pool.chainid}]`, "Failed to get price for", pool.vaultasset, "from price provider")
        return;
    }

    // console.log(lockup_xrate)
    // console.log('the issuer token is ', pool.vaultasset)
    // console.log('pool has', sumPackets, ' activated packets')
    // const numerator = getBigInt(sumPackets) * getBigInt(pool.packetsize) / (getBigInt(10) ** getBigInt(pool.packetsizedecimals))
    // console.log('thats ', numerator, 'issuer tokens at a packet size of ', formatUnits(getBigInt(pool.packetsize), pool.packetsizedecimals))
    // console.log('issuer tokens are worth ', formatUnits(lockup_xrate, 18), 'in eth or ', formatUnits(lockup_xrate * eth, 18), 'in the $')
    
    let issuerVolume = 0;
    const im1 = getBigInt(sumPackets) * getBigInt(pool.packetsize) * lockup_xrate * eth
    const im2 = im1 / (getBigInt(10) ** getBigInt(18 + pool.packetsizedecimals))
    issuerVolume = parseFloat(im2.toString())


    // console.log(numerator, ' * ', formatUnits(lockup_xrate * eth, 18), ' = $', issuerVolume)
    const purchaserVolume = issuerVolume * parseFloat(formatUnits(getBigInt(pool.rate), 18))
    // console.log(formatUnits(getBigInt(pool.rate), 18), ' is the upfront rate so purchaser volume is', purchaserVolume)

    updatePoolVolume(pool, (issuerVolume + purchaserVolume).toFixed(2))
}

async function reconcile(chainid: number) {
    console.log(`[${chainid}] Reconciling db with subgraph`);

    const pools = await readPools(chainid);

    await Promise.all(pools.map( pool => volumeForPool(pool)))
}
async function main() {
    await connect();
    console.log("Connected to db");

    cron.schedule("*/1 * * * *", async () => {
        eth = getBigInt(Math.round(await eth_price()))
        await Promise.all(CHAIN_IDS.map((chainid) => {
            return reconcile(chainid);
        }))
    });
}


main().then()