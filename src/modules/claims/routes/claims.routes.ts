import { Router } from "express";
import {
  getClassifiedClaimsController,
  getOpenUnpaidClaimsController,
  getPendingClaimsCountController
} from "../controllers/claims.controller";

export const claimsRouter = Router();
// classify claims where status is "Pending" and return the count of each classification
claimsRouter.get("/classified", getClassifiedClaimsController);
claimsRouter.get("/open-unpaid", getOpenUnpaidClaimsController);
// count all claim where status is "Pending"
claimsRouter.get("/pending-count", getPendingClaimsCountController);
