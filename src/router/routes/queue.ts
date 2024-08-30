import { Request, Response } from "express";

import { CHAIN_IDS } from "@resonate/lib/constants";
import { getEnqueuedEvents } from "@resonate/db";
import { getPoolQueues } from "@resonate/lib/service";

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export async function handleGetEnqueuedEvents(req: Request, res: Response) {
    const chainId = parseInt(String(req.query.chainId));

    if (!chainId) {
        return res.status(400).json({ ERR: "chainId is required" });
    }

    if (!CHAIN_IDS.includes(parseInt(String(chainId)))) {
        return res.status(400).json({ ERR: "Invalid chainId" });
    }

    const poolId = req.query.poolId ? String(req.query.poolId) : undefined;
    const owner = req.query.owner ? String(req.query.owner) : undefined;

    const events = await getEnqueuedEvents({ chainId, poolId, owner });

    return res.status(200).json(events);
}

export async function handleGetQueueState(req: Request, res: Response) {
    const chainId = parseInt(String(req.query.chainId));

    if (!chainId) {
        return res.status(400).json({ ERR: "chainId is required" });
    }

    if (!CHAIN_IDS.includes(parseInt(String(chainId)))) {
        return res.status(400).json({ ERR: "Invalid chainId" });
    }

    const poolId = req.query.poolId ? String(req.query.poolId) : undefined;

    if (!poolId) {
        return res.status(400).json({ ERR: "poolId is required" });
    }

    const events = await getPoolQueues(chainId, poolId);

    return res.status(200).json(events);
}
