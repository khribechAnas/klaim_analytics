import express from "express";
import path from "path";
import { env } from "../config/env";
import { closeMongoConnection } from "../db/mongodb";
import { createApiRouter } from "./routes";

export async function startServer() {
  const app = express();
  const staticDir = path.resolve(__dirname, "public");

  app.use(express.json());
  app.use(express.static(staticDir));
  app.use("/api", createApiRouter());

  const server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closeMongoConnection();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
