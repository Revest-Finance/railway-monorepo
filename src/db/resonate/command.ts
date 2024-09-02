import { EnqueuedEvent } from "@resonate/models/models";
import { randomUUID } from "crypto";
import { resonateDB } from "..";
import { Adapter, EnqueuedEvents, Fnft, Oracle, Pool, Token, Vault } from "./entities";

export type PoolRequest = Omit<Pool, "id">;

export async function addPool(pool: PoolRequest) {
    const previousPool = await resonateDB
        .getRepository(Pool)
        .findOne({ where: { poolId: pool.poolId, chainId: pool.chainId } });

    if (previousPool) {
        console.log(`[${pool.chainId}] PoolID = ${pool.poolId} already exists`);
        return;
    }

    await resonateDB.getRepository(Pool).save(pool);
}

export async function addAdapter(adapter: Omit<Adapter, "id">) {
    await resonateDB.getRepository(Adapter).save(adapter);
}

export async function addAdapters(adapters: Omit<Adapter, "id">[]) {
    const adaptersWithIds = adapters.map(adapter => ({ id: randomUUID(), ...adapter }));

    await resonateDB.getRepository(Adapter).save(adaptersWithIds);
}

export async function addOracle(oracle: Omit<Oracle, "id">) {
    await resonateDB.getRepository(Oracle).upsert(oracle, ["chainId", "asset"]);
}

export async function addFNFT(fnft: Omit<Fnft, "id">) {
    await resonateDB.getRepository(Fnft).upsert(fnft, ["chainId", "poolId", "fnftId"]);
}

export async function updateVault(vault: Omit<Vault, "id">) {
    const previousVault = await resonateDB
        .getRepository(Vault)
        .findOne({ where: { chainId: vault.chainId, address: vault.address } });

    if (!previousVault) {
        console.log(`[${vault.chainId}] Vault = ${vault.address} does not exist`);
        return;
    }

    if (previousVault.apy === vault.apy && previousVault.tvl === vault.tvl) {
        console.log(`[${vault.chainId}] Vault = ${vault.address} has not changed`);
        return;
    }

    await resonateDB
        .getRepository(Vault)
        .update({ chainId: vault.chainId, address: vault.address }, { apy: vault.apy, tvl: vault.tvl });
}

export async function batchUpdateFNFTs(fnfts: Omit<Fnft, "id">[]) {
    const filteredFnfts = fnfts.filter(fnft => Number(fnft.usd) === 0 || fnft.face === 0);

    await resonateDB.getRepository(Fnft).save(filteredFnfts);
}

export async function updatePoolTVL(chainId: number, poolId: string, tvl: string) {
    const previousPool = await resonateDB.getRepository(Pool).findOne({
        where: { poolId, chainId },
    });

    if (!previousPool) {
        console.log(`[${chainId}] PoolID = ${poolId} does not exist`);
        return;
    }

    if (previousPool.tvl === tvl) {
        console.log(`[${chainId}] PoolID = ${poolId} has not changed`);
        return;
    }

    await resonateDB.getRepository(Pool).update({ chainId, poolId }, { tvl });
}

export async function batchUpdatePoolTVLs(updateRequest: { chainId: number; poolId: string; tvl: string }[]) {
    for (const { chainId, poolId, tvl } of updateRequest) {
        await updatePoolTVL(chainId, poolId, tvl);
    }
}

export async function updatePoolVolume(chainId: number, poolId: string, volume: string) {
    const previousPool = await resonateDB.getRepository(Pool).findOne({
        where: { poolId, chainId },
    });

    if (!previousPool) {
        console.log(`[${chainId}] PoolID = ${poolId} does not exist`);
        return;
    }

    if (previousPool.usdVolume === volume) {
        console.log(`[${chainId}] PoolID = ${poolId} has not changed`);
        return;
    }

    await resonateDB.getRepository(Pool).update({ chainId, poolId }, { usdVolume: volume });
}

export async function addEnqueuedEvents(data: EnqueuedEvent[]) {
    const dataWithIds = data.map(enqueuedEvent => ({ id: randomUUID(), ...enqueuedEvent }));

    await resonateDB.getRepository(EnqueuedEvents).save(dataWithIds);
}

export async function addToken(token: Omit<Token, "id">) {
    await resonateDB.getRepository(Token).save(token);
}
