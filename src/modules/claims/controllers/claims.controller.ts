import { Request, Response } from "express";
import { getOpenUnpaidClaimsService } from "../services/getOpenUnpaidClaims.service";

export async function getOpenUnpaidClaimsController(req: Request, res: Response) {
  try {
    const pageParam = req.query.page;
    const limitParam = req.query.limit;
    const page = typeof pageParam === "string" ? parseInt(pageParam, 10) : 1;
    const limit = typeof limitParam === "string" ? parseInt(limitParam, 10) : 50;

    if (isNaN(page)) {
      res.status(400).json({ message: "Page must be a valid number" });
      return;
    }

    if (isNaN(limit)) {
      res.status(400).json({ message: "Limit must be a valid number" });
      return;
    }

    const data = await getOpenUnpaidClaimsService({ page, limit });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch open unpaid claims.", error });
  }
}
