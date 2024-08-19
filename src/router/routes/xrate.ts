import { isAddress } from "ethers";
import { Request, Response } from "express";

import { CHAIN_IDS } from "@resonate/lib/constants";
import { getXrate } from "@resonate/db";

export async function handleGetXrate(req: Request, res: Response) {
    // should only two params
    if (Object.keys(req.params).length != 2) {
        return res.status(400).json({ ERR: "Invalid num of parameters" });
    }

    if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) {
        return res.status(400).json({ ERR: "Invalid chainid" });
    }

    if (!isAddress(req.params.address)) {
        return res.status(400).json({ ERR: "Invalid address" });
    }

    const address = req.params.address.toLowerCase(); // insert checksum
    const chainid = parseInt(req.params.chainid);
    const xrate = await getXrate(address, chainid);

    if (!xrate) {
        return res.status(400).json({ ERR: `[${chainid}] xrate for ${address} not found.` });
    }

    return res.status(200).json(xrate);
}
