import { Collection, Document, MongoClient } from "mongodb";
import { env } from "../config/env";

const mongoClient = new MongoClient(env.mongoUri);
let mongoConnectionPromise: Promise<MongoClient> | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoClient.connect();
  }

  return mongoConnectionPromise;
}

export async function getClaimsCollection(): Promise<Collection<Document>> {
  const client = await getMongoClient();
  return client.db(env.mongoDbName).collection(env.mongoClaimsCollection);
}

export async function getDealsCollection(): Promise<Collection<Document>> {
  const client = await getMongoClient();
  return client.db(env.mongoDbName).collection(env.mongoDealsCollection);
}

export async function closeMongoConnection(): Promise<void> {
  if (!mongoConnectionPromise) {
    return;
  }

  await mongoClient.close();
  mongoConnectionPromise = null;
}
