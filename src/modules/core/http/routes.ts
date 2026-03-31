import { Router } from "express";
import { claimsRouter } from "../../claims/routes/claims.routes";
import { dealsRouter } from "../../deals/routes/deals.routes";

export function createApiRouter(): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.use("/claims", claimsRouter);
  router.use("/deals", dealsRouter);

  return router;
}
