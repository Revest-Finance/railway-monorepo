import { getPoints } from "@resonate/lib/points";
import { Request, Response } from "express";

export async function handleGetPoints(req: Request, res: Response) {
    try {
        const startDate = new Date(String(req.query.startDate));
        const endDate = new Date(String(req.query.endDate));

        if (!startDate || !endDate) {
            return res.status(400).json({ ERR: "Invalid date range" });
        }

        const points = await getPoints(startDate, endDate);
        return res.status(200).json(points);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ ERR: "Something went wrong" });
    }
}
