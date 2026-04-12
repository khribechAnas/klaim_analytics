import { CLASSIFICATION_RULES } from "./classification.constants";
import { ClaimDocument, ClassificationCode, ClassificationResult } from "./classification.types";

export function computeDaysOverdue(settlementDate: Date | undefined): number {
  if (!settlementDate) {
    return -1;
  }

  const settlementTime = settlementDate.getTime();

  if (Number.isNaN(settlementTime)) {
    return -1;
  }

  const today = new Date();
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysOverdue = Math.floor((today.getTime() - settlementTime) / millisecondsPerDay);

  if (daysOverdue < 0) {
    return 0;
  }

  return daysOverdue;
}

export function assignClassificationCode(daysOverdue: number): ClassificationCode {
  if (daysOverdue <= 0) {
    return "P1";
  }

  if (daysOverdue <= 30) {
    return "U1";
  }

  if (daysOverdue <= 60) {
    return "U2";
  }

  if (daysOverdue <= 90) {
    return "U3";
  }

  return "U4";
}

function roundToTwoDecimals(value: number): number {
  return Number(value.toFixed(2));
}

export function computeClassification(claim: ClaimDocument): ClassificationResult {
  const settlementDateValue = claim.settlementDate;
  const settlementDate =
    settlementDateValue instanceof Date
      ? settlementDateValue
      : settlementDateValue
        ? new Date(settlementDateValue)
        : undefined;
  const daysOverdue = computeDaysOverdue(settlementDate);
  const code = assignClassificationCode(daysOverdue);
  const rule = CLASSIFICATION_RULES[code];
  const netAmount = typeof claim.netAmount === "number" ? claim.netAmount : 0;
  const provisionAmount = roundToTwoDecimals(netAmount * rule.provisionRate);
  const navHaircutAmount = roundToTwoDecimals(netAmount * rule.navHaircutRate);
  const confident = daysOverdue !== -1;
  const note =
    daysOverdue === -1
      ? "Settlement date is missing"
      : daysOverdue === 0
        ? "Not yet due"
        : `Overdue by ${daysOverdue} days`;

  return {
    code: rule.code,
    label: rule.label,
    category: rule.category,
    provisionRate: rule.provisionRate,
    navHaircutRate: rule.navHaircutRate,
    provisionAmount,
    navHaircutAmount,
    daysOverdue,
    confident,
    note
  };
}
