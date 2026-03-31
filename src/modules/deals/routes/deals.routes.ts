import { Router } from "express";
import { getDealsCountByStatusController } from "../controllers/deals.controller";

export const dealsRouter = Router();

dealsRouter.get("/count-by-status", getDealsCountByStatusController);
