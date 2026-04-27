import { CLASSIFICATION_RULES } from "./classification.constants";
import { ClaimDocument, ClassificationCode, ClassificationResult } from "./classification.types";

function getLatestExpectedPaymentDate(claim: ClaimDocument): Date | undefined {
  const payments = claim.expectedCfs?.payment;

  if (!Array.isArray(payments) || payments.length === 0) {
    return undefined;
  }

  let maxTime: number | undefined;

  payments.forEach((payment) => {
    const dateValue = payment?.date;

    if (!dateValue) {
      return;
    }

    const parsedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const parsedTime = parsedDate.getTime();

    if (Number.isNaN(parsedTime)) {
      return;
    }

    if (maxTime === undefined || parsedTime > maxTime) {
      maxTime = parsedTime;
    }
  });

  if (maxTime === undefined) {
    return undefined;
  }

  return new Date(maxTime);
}

export function computeDaysOverdue(dueDate: Date | undefined): number {
  if (!dueDate) {
    return -1;
  }

  const dueDateTime = dueDate.getTime();

  if (Number.isNaN(dueDateTime)) {
    return -1;
  }

  const today = new Date();
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysOverdue = Math.floor((today.getTime() - dueDateTime) / millisecondsPerDay);

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
  const dueDate = getLatestExpectedPaymentDate(claim);
  const daysOverdue = computeDaysOverdue(dueDate);
  const code = assignClassificationCode(daysOverdue);
  const rule = CLASSIFICATION_RULES[code];
  const netAmount = typeof claim.netAmount === "number" ? claim.netAmount : 0;
  const provisionAmount = roundToTwoDecimals(netAmount * rule.provisionRate);
  const navHaircutAmount = roundToTwoDecimals(netAmount * rule.navHaircutRate);
  const confident = daysOverdue !== -1;
  const note =
    daysOverdue === -1
      ? "Expected payment date is missing"
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
