import express from "express";
import { env } from "../config/env";
import { closeMongoConnection } from "../db/mongodb";
import { createApiRouter } from "./routes";

export async function startServer() {
  const app = express();

  app.use(express.json());
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
