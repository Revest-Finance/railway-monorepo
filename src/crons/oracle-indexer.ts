import { CHAIN_IDS } from "@resonate/lib/constants";
import { addOracle, readOracles } from "@resonate/lib/db.indexers";
import { getRegisteredOracles } from "@resonate/lib/eth.api";

async function reconcile(chainId: number) {
    const tokenOracles = await getRegisteredOracles(chainId);

    for (const oracle of tokenOracles) {
        const dbOracles = await readOracles(chainId);

        if (!dbOracles.includes(oracle.token)) {
            await addOracle({
                chainid: chainId,
                asset: oracle.token,
                oracle: oracle.oracle,
                ts: oracle.blockNumber,
            });
        }
    }
}

export async function grindOracles() {
    console.log("Grinding oracles at", new Date().toISOString());

    const results = await Promise.allSettled(
        CHAIN_IDS.map(chainId => {
            return reconcile(chainId);
        }),
    );

    for (const result of results) {
        if (result.status === "rejected") {
            console.error(result.reason);
        }
    }

    console.log("Finished grinding oracles at", new Date().toISOString());
}
