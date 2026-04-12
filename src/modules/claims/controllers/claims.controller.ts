import { Request, Response } from "express";
import { ClassificationCode } from "../classification.types";
import { classifyClaims } from "../services/classifyClaims.service";
import {
  getOpenUnpaidClaimsService
} from "../services/getOpenUnpaidClaims.service";

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

export async function getClassifiedClaimsController(_req: Request, res: Response) {
  try {
    const pageParam = _req.query.page;
    const limitParam = _req.query.limit;
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

    const { totalClaims, totalPages, claimsCount, claims } = await getOpenUnpaidClaimsService({
      page,
      limit
    });
    const classifiedClaims = classifyClaims(claims);
    const summary: Record<ClassificationCode, { count: number; totalNetAmount: number }> = {
      P1: { count: 0, totalNetAmount: 0 },
      U1: { count: 0, totalNetAmount: 0 },
      U2: { count: 0, totalNetAmount: 0 },
      U3: { count: 0, totalNetAmount: 0 },
      U4: { count: 0, totalNetAmount: 0 }
    };

    classifiedClaims.forEach((claim) => {
      const code = claim.classificationResult.code;
      const netAmount = typeof claim.netAmount === "number" ? claim.netAmount : 0;

      summary[code].count += 1;
      summary[code].totalNetAmount = Number((summary[code].totalNetAmount + netAmount).toFixed(2));
    });

    res.json({
      totalClaims,
      page,
      limit,
      totalPages,
      claimsCount,
      summary,
      claims: classifiedClaims.map((claim) => ({
        claimId: typeof claim.claimId === "string" ? claim.claimId : "",
        netAmount: typeof claim.netAmount === "number" ? claim.netAmount : 0,
        settlementDate: claim.settlementDate ?? null,
        classification: {
          code: claim.classificationResult.code,
          label: claim.classificationResult.label,
          daysOverdue: claim.classificationResult.daysOverdue,
          provisionAmount: claim.classificationResult.provisionAmount,
          navHaircutAmount: claim.classificationResult.navHaircutAmount
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch classified claims.", error });
  }
}
