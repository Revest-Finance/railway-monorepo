import { CHAIN_IDS } from "@resonate/lib/constants";
import { addAdapters, getLatestAdapterBlock } from "@resonate/db";
import { resonate_contracts } from "@resonate/lib/contracts";
import { EventLog } from "ethers";

interface AdapterEntry {
    underlyingVault: string;
    vaultAdapter: string;
    vaultAsset: string;
    blockNumber: number;
}

export async function indexAdaptersByChain(chainId: number) {
    const resonate = resonate_contracts[chainId];

    const latestBlock = await getLatestAdapterBlock(chainId);

    const events = (await resonate.queryFilter(
        resonate.filters.VaultAdapterRegistered(),
        latestBlock + 1,
        "latest",
    )) as EventLog[];

    const adapters: AdapterEntry[] = events.map(({ args, blockNumber }) => {
        const { underlyingVault, vaultAdapter, vaultAsset } = args;
        return { underlyingVault, vaultAdapter, vaultAsset, blockNumber };
    });

    const adaptersToIndex = adapters.map(adapter => ({
        chainId,
        adapter: adapter.vaultAdapter,
        asset: adapter.vaultAsset,
        vault: adapter.underlyingVault,
        blockNumber: adapter.blockNumber,
    }));

    await addAdapters(adaptersToIndex);
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
