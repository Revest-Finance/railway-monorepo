import { isHexString } from "ethers";
import { Request, Response } from "express";

import { CHAIN_IDS } from "@resonate/lib/constants";
import { getDegenPools, getFeaturedPools, getHeroPool, getPool, getPools } from "@resonate/db";

export async function handleGetPools(req: Request, res: Response) {
    // should only two params
    if (Object.keys(req.params).length != 1) {
        return res.status(400).json({ ERR: "Invalid num of parameters" });
    }

    if (!CHAIN_IDS.includes(parseInt(req.params.chainId))) {
        return res.status(400).json({ ERR: "Invalid chainId" });
    }

    const chainId = parseInt(req.params.chainId);
    const pools = await getPools(chainId);

    if (!pools) {
        return res.status(400).json({ ERR: `[${chainId}] Error occurred while fetching pools` });
    }

    return res.status(200).json(pools);
}

export async function handleGetPoolsById(req: Request, res: Response) {
    // should only two params
    if (Object.keys(req.params).length != 2) {
        return res.status(400).json({ ERR: "Invalid number of parameters" });
    }

    if (!CHAIN_IDS.includes(parseInt(req.params.chainId))) {
        return res.status(400).json({ ERR: "Invalid chainId" });
    }

    if (!isHexString(req.params.poolId, 32)) {
        return res.status(400).json({ ERR: "Invalid poolId" });
    }

    const poolId = req.params.poolId.toLowerCase(); // insert checksum
    const chainId = parseInt(req.params.chainId);
    const pool = await getPool(chainId, poolId);

    if (!pool) {
        return res.status(400).json({
            ERR: `[${chainId}] Error occurred while fetching pool ${poolId}`,
        });
    }

    return res.status(200).json(pool);
}

export async function handleGetHeroPools(req: Request, res: Response) {
    if (Object.keys(req.params).length != 1) {
        return res.status(400).json({ ERR: "Invalid number of parameters" });
    }

    if (!CHAIN_IDS.includes(parseInt(req.params.chainId))) {
        return res.status(400).json({ ERR: "Invalid chainId" });
    }

    const chainId = parseInt(req.params.chainId);
    const pools = await getHeroPool(chainId);

    if (!pools) {
        return res.status(400).json({ ERR: `[${chainId}] Error occurred while fetching pools` });
    }

    return res.status(200).json(pools);
}

export async function handleGetFeaturedPools(_: Request, res: Response) {
    const pools = await getFeaturedPools();

    if (!pools) {
        return res.status(400).json({ ERR: `Error occurred while fetching featured pools` });
    }

    return res.status(200).json(pools);
}

export async function handleGetDegenPools(_: Request, res: Response) {
    const pools = await getDegenPools();

    if (!pools) {
        return res.status(201).json({ ERR: `Error occurred while fetching featured pools` });
    }

    return res.status(200).json(pools);
}
