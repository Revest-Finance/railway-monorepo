import { Request, Response } from "express";

import { CHAIN_IDS } from "@resonate/lib/constants";
import { getFnftsForOwner } from "@resonate/lib/fnfts";
import { getAddress, isAddress } from "ethers";

export async function handleGetFNFTs(req: Request, res: Response) {
    if (Object.keys(req.params).length != 2) {
        return res.status(400).json({ ERR: "Invalid number of parameters" });
    }

    if (!CHAIN_IDS.includes(parseInt(req.params.chainId))) {
        return res.status(400).json({ ERR: "Invalid chainid" });
    }

    if (!isAddress(req.params.address)) {
        return res.status(400).json({ ERR: "Invalid address" });
    }

    const chainId = parseInt(req.params.chainId);
    const owner = getAddress(req.params.address);

    const fnfts = await getFnftsForOwner(chainId, owner);

    if (!fnfts) {
        return res.status(400).json({ ERR: `[${chainId}] Error occurred while fetching oracles` });
    }

    return res.status(200).json({
        endpoint: "GET :chainId/fnfts/:owner",
        timestamp: Date.now(),
        data: fnfts,
    });
}
