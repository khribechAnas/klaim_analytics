import { Request, Response } from "express";
import { getClaimsCountByStatusService } from "../services/getClaimsCountByStatus.service";
import { getPendingClaimsByPerformanceLabelService } from "../services/getPendingClaimsByPerformanceLabel.service";

export async function getClaimsCountByStatusController(_req: Request, res: Response) {
  try {
    const data = await getClaimsCountByStatusService();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch claims count by status.", error });
  }
}

export async function getPendingClaimsByPerformanceLabelController(_req: Request, res: Response) {
  try {
    const data = await getPendingClaimsByPerformanceLabelService();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pending claims by P1-U4 labels.", error });
  }
}
