import { getAddress, isAddress } from "ethers";
import { Request, Response } from "express";

import { CHAIN_IDS } from "@resonate/lib/constants";
import { getPoolByVault, getVaultInfo, isBeefyVault } from "@resonate/db";

export async function handleGetVault(req: Request, res: Response) {
    if (Object.keys(req.params).length != 2) {
        return res.status(400).json({ ERR: "Invalid number of parameters" });
    }

    if (!CHAIN_IDS.includes(parseInt(req.params.chainId))) {
        return res.status(400).json({ ERR: "Invalid chainId" });
    }

    if (!isAddress(req.params.address)) {
        return res.status(400).json({ ERR: "Invalid address" });
    }

    const address = getAddress(req.params.address.toLowerCase());
    const chainId = parseInt(req.params.chainId);
    const vaultInfo = await getVaultInfo(address, chainId);

    if (!vaultInfo) {
        return res.status(400).json({ ERR: `[${chainId}] ${address} not found.` });
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

    const isBeefy = await isBeefyVault(vault);

    if (!isBeefy) {
        return res.status(400).json({ ERR: `${vault} is not a beefy vault` });
    }

    const pool = await getPoolByVault(vault);

    if (!pool) {
        return res.status(404).json({ ERR: `No Resonate pools associated with ${vault}` });
    }

    return res.status(200).json(pool);
}
