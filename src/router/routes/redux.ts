import { Request, Response } from "express";

import { AUTH_KEY } from "@resonate/config";
import { getReduxStatistics, updateReduxStatistics } from "@resonate/lib/db.api";

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
    const data = await getReduxStatistics();

    return res.status(200).json(data);
}
