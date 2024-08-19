import { getBigInt, formatUnits } from "ethers";
import { CHAIN_IDS, eth_price } from "@resonate/lib/constants";
import { price_provider_contracts } from "@resonate/lib/contracts";
import { Pool, readPools, updatePoolVolume } from "@resonate/db";
import { getCapitalActivated } from "@resonate/lib/eth.api";

let eth = getBigInt(0);
async function volumeForPool(pool: Pool) {
    console.log(`[${pool.chainId}]`, "Updating volume for", pool.poolId);

    const sumPackets = await getCapitalActivated(pool.chainId, pool.poolId);

    if (sumPackets === 0) {
        return;
    }

    try {
        const assetPrice = (await price_provider_contracts[pool.chainId].getSafePrice(pool.vaultAsset)) as bigint;

        const im1 = getBigInt(sumPackets) * getBigInt(pool.packetSize) * assetPrice * eth;
        const im2 = im1 / getBigInt(10) ** getBigInt(18 + pool.packetSizeDecimals);
        const issuerVolume = parseFloat(im2.toString());

        const purchaserVolume = issuerVolume * parseFloat(formatUnits(getBigInt(pool.rate), 18));

        await updatePoolVolume(pool.chainId, pool.poolId, (issuerVolume + purchaserVolume).toFixed(2));
    } catch (e) {
        console.log(`[${pool.chainId}]`, "Failed to get price for", pool.vaultAsset, "from price provider");
        return;
    }
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
