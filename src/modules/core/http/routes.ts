import { Router } from "express";
import { claimsRouter } from "../../claims/routes/claims.routes";

export function createApiRouter(): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.use("/claims", claimsRouter);

  return router;
}
