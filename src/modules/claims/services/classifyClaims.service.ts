import { Collection } from "mongodb";
import { getClaimsCollection } from "../../core/db/mongodb";
import {
  ClaimClassificationDocument,
  ClassificationCode,
  ClassifiedClaim,
  ClaimDocument
} from "../classification.types";
import { computeClassification } from "../classification.utils";

const CLAIM_CLASSIFICATIONS_COLLECTION = "claim_classifications";

export function classifyClaims(claims: ClaimDocument[]): ClassifiedClaim[] {
  return claims.map((claim) => ({
    ...claim,
    classificationResult: computeClassification(claim)
  }));
}

export function buildClassificationSummary(
  classifiedClaims: ClassifiedClaim[]
): Record<ClassificationCode, { count: number; totalNetAmount: number }> {
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

  return summary;
}

async function getClaimClassificationsCollection(): Promise<Collection<ClaimClassificationDocument>> {
  const claimsCollection = await getClaimsCollection();

  return claimsCollection.db.collection<ClaimClassificationDocument>(CLAIM_CLASSIFICATIONS_COLLECTION);
}

export async function saveClaimClassifications(classifiedClaims: ClassifiedClaim[]): Promise<void> {
  const claimClassificationsCollection = await getClaimClassificationsCollection();
  const classifiedAt = new Date().toISOString().slice(0, 10);

  await Promise.all(
    classifiedClaims
      .filter((claim) => typeof claim.claimId === "string" && claim.claimId.length > 0)
      .map((claim) =>
        claimClassificationsCollection.updateOne(
          { claimId: claim.claimId as string },
          {
            $set: {
              claimId: claim.claimId as string,
              classifiedAt,
              netAmount: typeof claim.netAmount === "number" ? claim.netAmount : 0,
              daysOverdue: claim.classificationResult.daysOverdue,
              classification: claim.classificationResult
            }
          },
          { upsert: true }
        )
      )
  );
}
