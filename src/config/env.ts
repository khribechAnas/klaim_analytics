export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  mongoUri: requireEnv("MONGO_URI"),
  mongoDbName: requireEnv("MONGO_DB_NAME"),
  mongoClaimsCollection: requireEnv("MONGO_CLAIMS_COLLECTION"),
  mongoDealsCollection: requireEnv("MONGO_DEALS_COLLECTION")
};
