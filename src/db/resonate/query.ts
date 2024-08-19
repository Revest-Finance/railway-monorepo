import { Not } from "typeorm";
import { Adapter, Fnft, Oracle, Pool, resonateDB, Vault, XRate } from "..";

export async function readPoolIds(chainId: number) {
    const ids = await resonateDB.getRepository(Pool).find({
        select: ["poolId"],
        where: { chainId },
    });

    return ids.map(id => id.poolId);
}

export async function readPools(chainId: number) {
    return resonateDB.getRepository(Pool).find({ where: { chainId } });
}

export async function getAdapters(chainId: number) {
    return resonateDB.getRepository(Adapter).find({ where: { chainId } });
}

export async function getLatestAdapterBlock(chainId: number) {
    const adapter = await resonateDB.getRepository(Adapter).findOne({
        where: { chainId },
        order: { blockNumber: "DESC" },
    });

    return adapter?.blockNumber ?? 0;
}

export async function getOracles(chainId: number) {
    return resonateDB.getRepository(Oracle).find({ where: { chainId } });
}

export async function getPoolByVault(vault: string) {
    return resonateDB.getRepository(Pool).findOne({ where: { vault } });
}

export async function readAdapters(chainId: number) {
    const adapters = await resonateDB.getRepository(Adapter).find({
        select: ["adapter"],
        where: { chainId },
    });

    return adapters.map(adapter => adapter.adapter);
}

export async function readOracles(chainId: number) {
    const oracles = await resonateDB.getRepository(Oracle).find({
        select: ["asset"],
        where: { chainId },
    });

    return oracles.map(oracle => oracle.asset);
}

export async function readAllFNFTS(chainId: number) {
    return resonateDB.getRepository(Fnft).find({ where: { chainId } });
}

export async function readVaultsFromProvider(provider: string) {
    return resonateDB.getRepository(Vault).find({ where: { provider } });
}

export async function getTVL() {
    const result = await resonateDB.manager
        .createQueryBuilder()
        .select(`COALESCE(SUM(fnft.usd), 0) + COALESCE(SUM(pool.tvl), 0) AS total`)
        .from("fnfts", "fnft")
        .leftJoin("pools", "pool", "fnft.chainid = pool.chainid")
        .getRawOne<{ total: string }>();

    return Math.floor(parseFloat(result?.total ?? "0"));
}

export async function getChainTVL(chainId: number) {
    if (!Number.isInteger(chainId)) {
        return 0;
    }

    const result = await resonateDB.manager
        .createQueryBuilder()
        .select(`COALESCE(SUM(fnft.usd), 0) + COALESCE(SUM(pool.tvl), 0) AS total`)
        .from("fnfts", "fnft")
        .leftJoin("pools", "pool", "fnft.chainid = pool.chainid")
        .where("fnft.chainid = :chainId", { chainId })
        .orWhere("pool.chainid = :chainId", { chainId })
        .getRawOne<{ total: string }>();

    return Math.floor(parseFloat(result?.total ?? "0"));
}

export async function getVaultInfo(address: string, chainId: number) {
    return resonateDB.getRepository(Vault).findOne({ where: { address, chainId } });
}

export async function getXrate(address: string, chainId: number) {
    return resonateDB.getRepository(XRate).findOne({ where: { address, chainId } });
}

export async function getFeaturedPools() {
    return resonateDB.getRepository(Pool).find({ where: { status: 2 } });
}

export async function getDegenPools() {
    return resonateDB.getRepository(Pool).find({ where: { status: 3 } });
}

export async function getHeroPool(chainId: number) {
    return resonateDB.getRepository(Pool).findOne({ where: { chainId, status: 4 } });
}

export async function getPool(chainId: number, poolId: string) {
    return resonateDB.getRepository(Pool).findOne({ where: { chainId, poolId } });
}

export async function getPools(chainId: number) {
    return resonateDB.getRepository(Pool).find({ where: { chainId, status: Not(-1) } });
}

export async function isVerified(poolId: string, chainId: number) {
    const pool = await resonateDB.getRepository(Pool).findOne({ select: ["verifiedBy"], where: { chainId, poolId } });

    return !!pool?.verifiedBy;
}

export async function isBeefyVault(vaultAddress: string) {
    return await resonateDB
        .getRepository(Vault)
        .exists({ where: { address: vaultAddress, provider: "Beefy Finance" } });
}
