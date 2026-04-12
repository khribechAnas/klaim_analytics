import { Router } from "express";
import { getOpenUnpaidClaimsController } from "../controllers/claims.controller";

export const claimsRouter = Router();

claimsRouter.get("/open-unpaid", getOpenUnpaidClaimsController);
