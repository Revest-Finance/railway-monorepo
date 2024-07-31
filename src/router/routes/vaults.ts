import { getAddress, isAddress } from "ethers";
import { Request, Response } from "express";

import { CHAIN_IDS } from "@resonate/lib/constants";
import { getPoolByVault, getVaultInfo, isBeefyVault } from "@resonate/lib/db.api";

export async function handleGetVault(req: Request, res: Response) {
    if (Object.keys(req.params).length != 2) {
        return res.status(400).json({ ERR: "Invalid number of parameters" });
    }

    if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) {
        return res.status(400).json({ ERR: "Invalid chainid" });
    }

    if (!isAddress(req.params.address)) {
        return res.status(400).json({ ERR: "Invalid address" });
    }

    const address = getAddress(req.params.address.toLowerCase());
    const chainid = parseInt(req.params.chainid);
    const vaultInfo = await getVaultInfo(address, chainid);

    if (!vaultInfo) {
        return res.status(400).json({ ERR: `[${chainid}] ${address} not found.` });
    }

    return res.status(200).json(vaultInfo);
}

export async function handleGetBeefyVault(req: Request, res: Response) {
    if (Object.keys(req.params).length != 1) {
        return res.status(400).json({ ERR: "Invalid number of parameters" });
    }

    if (!isAddress(req.params.vault)) {
        return res.status(400).json({ ERR: "Invalid address" });
    }

    const vault = getAddress(req.params.vault);

    if (await isBeefyVault(vault)) {
        const pool = await getPoolByVault(vault);
        if (!pool) return res.status(201).json({ ERR: `No Resonate pools associated with ${vault}` });
        return res.status(200).json(pool);
    } else {
        return res.status(201).json({
            ERR: `${vault} is not a beefy vault, or not supported by Resonate`,
        });
    }
}
