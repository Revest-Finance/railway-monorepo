import { addOracle, readOracles } from "@resonate/db";
import { CHAIN_IDS } from "@resonate/lib/constants";

import { getRegisteredOracles } from "@resonate/lib/eth.api";

async function reconcile(chainId: number) {
    const dbOracles = await readOracles(chainId);

    const tokenOracles = await getRegisteredOracles(chainId);

    for (const oracle of tokenOracles) {
        if (!dbOracles.includes(oracle.token)) {
            await addOracle({
                timestamp: oracle.timestamp,
                oracleAddress: oracle.oracle,
                chainId: chainId,
                asset: oracle.token,
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
