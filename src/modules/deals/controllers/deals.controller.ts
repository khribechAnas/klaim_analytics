import { Request, Response } from "express";
import { getDealsCountByStatusService } from "../services/getDealsCountByStatus.service";

export async function getDealsCountByStatusController(_req: Request, res: Response) {
  try {
    const data = await getDealsCountByStatusService();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch deals count by status.", error });
  }
}
