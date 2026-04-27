export type ClassificationCode = "P1" | "U1" | "U2" | "U3" | "U4";

export interface ClassificationResult {
  code: ClassificationCode;
  label: string;
  category: string;
  provisionRate: number;
  navHaircutRate: number;
  provisionAmount: number;
  navHaircutAmount: number;
  daysOverdue: number;
  confident: boolean;
  note: string;
}

export interface ClaimDocument {
  [key: string]: unknown;
  netAmount?: number;
  settlementDate?: Date | string;
  expectedCfs?: {
    payment?: Array<{
      date?: Date | string;
      amount?: number;
    }>;
    rejection?: unknown[];
  };
  claimId?: string;
}

export interface ClassifiedClaim extends ClaimDocument {
  classificationResult: ClassificationResult;
}

export interface ClaimClassificationDocument {
  claimId: string;
  classifiedAt: string;
  netAmount: number;
  daysOverdue: number;
  classification: ClassificationResult;
}
