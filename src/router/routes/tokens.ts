import { Request, Response } from "express";

import { CHAIN_IDS } from "@resonate/lib/constants";
import { getTokensByChain } from "@resonate/db";

export async function handleGetTokens(req: Request, res: Response) {
    const chainId = parseInt(String(req.params.chainId));

    if (!chainId) {
        return res.status(400).json({ ERR: "chainId is required" });
    }

    if (!CHAIN_IDS.includes(parseInt(String(chainId)))) {
        return res.status(400).json({ ERR: "Invalid chainId" });
    }

    const tokens = await getTokensByChain(chainId);

    return res.status(200).json(tokens);
}
