import { Response, Request } from "express";

import { getTVL, getChainTVL } from "@resonate/db";
import { CHAIN_IDS } from "@resonate/lib/constants";

export async function handleTVL(req: Request, res: Response) {
    if (Object.keys(req.params).length != 0) {
        return res.status(400).json({ ERR: "Invalid number of parameters" });
    }

    const tvl = await getTVL();

    if (!tvl) return res.status(400).json({ ERR: `TVL error` });
    return res.status(200).json(tvl);
}

export async function handleChainTVL(req: Request, res: Response) {
    if (Object.keys(req.params).length != 1) {
        return res.status(400).json({ ERR: "Invalid number of parameters" });
    }

    if (!CHAIN_IDS.includes(parseInt(req.params.chainId))) {
        return res.status(400).json({ ERR: "Invalid chainId" });
    }

    const chainId = parseInt(req.params.chainId);
    const tvl = await getChainTVL(Number(chainId));

    if (!tvl) {
        return res.status(400).json({ ERR: `[${chainId}] TVL error` });
    }

    return res.status(200).json(tvl);
}
