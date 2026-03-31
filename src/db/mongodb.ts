import { Collection, Db, Document, MongoClient } from "mongodb";
import { env } from "../config/env";

export type MongoContext = {
  client: MongoClient;
  db: Db;
  claimsCollection: Collection<Document>;
  dealsCollection: Collection<Document>;
};

export async function connectMongo(): Promise<MongoContext> {
  const client = new MongoClient(env.mongoUri);
  await client.connect();

  const db = client.db(env.mongoDbName);
  const claimsCollection = db.collection(env.mongoClaimsCollection);
  const dealsCollection = db.collection(env.mongoDealsCollection);

  return {
    client,
    db,
    claimsCollection,
    dealsCollection
  };
}
