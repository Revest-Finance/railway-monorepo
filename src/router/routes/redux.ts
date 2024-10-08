import { Request, Response } from "express";

import { AUTH_KEY } from "@resonate/config";
import { getReduxStatistics, updateReduxStatistics } from "@resonate/db";
import { getIndividualStatistics, getOverallReduxStatistics } from "@resonate/lib/redux";

function isAuthorized(request: any): boolean {
    const auth = request.headers.authorization;

    return !!auth && auth === AUTH_KEY;
}

export async function handleUpdateReduxStatistics(req: Request, res: Response) {
    if (!isAuthorized(req)) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    await updateReduxStatistics(req.body);

    return res.status(200).json({ message: "Success" });
}

export async function handleGetReduxStatistics(_: Request, res: Response) {
    const data = await getOverallReduxStatistics();

    return res.status(200).json(data);
}

export async function handleGetIndividualStatistics(req: Request, res: Response) {
    const address = req.params.address;

    if (!address) {
        return res.status(400).json({ message: "Invalid address" });
    }

    const data = await getIndividualStatistics(address);

    return res.status(200).json(data);
}
