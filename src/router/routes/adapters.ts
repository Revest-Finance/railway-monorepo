import { Request, Response } from "express";

import { CHAIN_IDS } from "@resonate/lib/constants";
import { getAdapters } from "@resonate/db";

export async function handleGetAdapters(req: Request, res: Response) {
    if (Object.keys(req.params).length != 1) {
        return res.status(400).json({ ERR: "Invalid number of parameters" });
    }

    if (!CHAIN_IDS.includes(parseInt(req.params.chainId))) {
        return res.status(400).json({ ERR: "Invalid chainid" });
    }

    const chainId = parseInt(req.params.chainId);

    const adapters = await getAdapters(chainId);
    if (!adapters) {
        return res.status(400).json({ ERR: `[${chainId}] Error occurred while fetching adapters` });
    }

    return res.status(200).json(adapters);
}
