import { Router } from "express";
import {
  getClassifiedClaimsController,
  getOpenUnpaidClaimsController
} from "../controllers/claims.controller";

export const claimsRouter = Router();

claimsRouter.get("/classified", getClassifiedClaimsController);
claimsRouter.get("/open-unpaid", getOpenUnpaidClaimsController);
