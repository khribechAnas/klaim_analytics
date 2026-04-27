import { Request, Response } from "express";
import {
  classifyClaims
} from "../services/classifyClaims.service";
import {
  getClassifiedOpenUnpaidClaimsService,
  getPendingClaimsCountService,
  getOpenUnpaidClaimsService
} from "../services/getOpenUnpaidClaims.service";
import { ClassificationCode } from "../classification.types";

const VALID_CLASSIFICATION_CODES: ClassificationCode[] = ["P1", "U1", "U2", "U3", "U4"];

function parseClassificationCodesFilter(
  classificationQuery: Request["query"]["classification"]
): ClassificationCode[] {
  const rawValues = Array.isArray(classificationQuery) ? classificationQuery : [classificationQuery];

  const normalizedValues = rawValues
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toUpperCase())
    .filter((value) => value.length > 0);

  const invalidValues = normalizedValues.filter(
    (value) => !VALID_CLASSIFICATION_CODES.includes(value as ClassificationCode)
  );

  if (invalidValues.length > 0) {
    throw new Error(
      `Invalid classification filter value(s): ${invalidValues.join(", ")}. Allowed values: ${VALID_CLASSIFICATION_CODES.join(", ")}`
    );
  }

  return [...new Set(normalizedValues)] as ClassificationCode[];
}

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
    const classificationQuery = _req.query.classification;
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

    let classificationCodes: ClassificationCode[] = [];
    try {
      classificationCodes = parseClassificationCodesFilter(classificationQuery);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid classification filter";
      res.status(400).json({ message });
      return;
    }

    const { totalClaims, totalPages, claimsCount, claims, globalSummary } =
      await getClassifiedOpenUnpaidClaimsService({
        page,
        limit,
        classificationCodes
      });
    const classifiedClaims = classifyClaims(claims);

    res.json({
      totalClaims,
      page,
      limit,
      totalPages,
      claimsCount,
      filters: {
        classification: classificationCodes
      },
      globalSummary,
      claims: classifiedClaims.map((claim) => {
        const { classificationResult, ...claimData } = claim;
        return {
          ...claimData,
          classification: {
            code: classificationResult.code,
            label: classificationResult.label,
            daysOverdue: classificationResult.daysOverdue,
            provisionAmount: classificationResult.provisionAmount,
            navHaircutAmount: classificationResult.navHaircutAmount
          }
        };
      })
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch classified claims.", error });
  }
}

export async function getPendingClaimsCountController(_req: Request, res: Response) {
  try {
    const count = await getPendingClaimsCountService();
    res.json({ status: "Pending", count });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pending claims count.", error });
  }
}
