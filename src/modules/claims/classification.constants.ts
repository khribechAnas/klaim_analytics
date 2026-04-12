import { ClassificationCode } from "./classification.types";

interface ClassificationRule {
  code: ClassificationCode;
  label: string;
  category: string;
  provisionRate: number;
  navHaircutRate: number;
}

export const CLASSIFICATION_RULES: Record<ClassificationCode, ClassificationRule> = {
  P1: {
    code: "P1",
    label: "Current - Performing",
    category: "Performing",
    provisionRate: 0.0,
    navHaircutRate: 0.0
  },
  U1: {
    code: "U1",
    label: "Overdue 1-30 Days",
    category: "Unpaid",
    provisionRate: 0.02,
    navHaircutRate: 0.03
  },
  U2: {
    code: "U2",
    label: "Overdue 31-60 Days",
    category: "Unpaid",
    provisionRate: 0.05,
    navHaircutRate: 0.07
  },
  U3: {
    code: "U3",
    label: "Overdue 61-90 Days",
    category: "Unpaid",
    provisionRate: 0.1,
    navHaircutRate: 0.15
  },
  U4: {
    code: "U4",
    label: "Overdue > 90 Days",
    category: "Unpaid",
    provisionRate: 0.2,
    navHaircutRate: 0.25
  }
};
