import { Router } from "express";
import {
  getClaimsCountByStatusController,
  getPendingClaimsByPerformanceLabelController
} from "../controllers/claims.controller";

export const claimsRouter = Router();

claimsRouter.get("/count-by-status", getClaimsCountByStatusController);
claimsRouter.get("/pending-by-performance-label", getPendingClaimsByPerformanceLabelController);
