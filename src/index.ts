import "dotenv/config";
import { startServer } from "./modules/core/http/server";

startServer().catch(() => {
  process.exitCode = 1;
});