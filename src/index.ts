import "dotenv/config";
import { runApp } from "./app";

runApp().catch(() => {
  process.exitCode = 1;
});