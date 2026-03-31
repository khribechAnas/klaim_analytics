export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function getPort(): number {
  const rawPort = process.env.PORT;
  if (!rawPort) return 3000;

  const parsedPort = Number(rawPort);
  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error("Invalid PORT env var. It must be a positive integer.");
  }

  return parsedPort;
}

export const env = {
  port: getPort(),
  mongoUri: requireEnv("MONGO_URI"),
  mongoDbName: requireEnv("MONGO_DB_NAME"),
  mongoClaimsCollection: requireEnv("MONGO_CLAIMS_COLLECTION"),
  mongoDealsCollection: requireEnv("MONGO_DEALS_COLLECTION")
};
