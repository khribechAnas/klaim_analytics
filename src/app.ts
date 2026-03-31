import { getClaimsCountByStatus, getPendingClaimsByPerformanceLabel } from "./analytics/claims";
import { getDealsCountByStatus } from "./analytics/deals";
import { env } from "./config/env";
import { connectMongo } from "./db/mongodb";

export async function runApp() {
  const { client, claimsCollection, dealsCollection } = await connectMongo();

  try {
    const claimsByStatus = await getClaimsCountByStatus(claimsCollection);
    console.log("\nClaims count by status (Answered / Pending / Executed):");
    console.table(claimsByStatus);

    const pendingClaimsByBucket = await getPendingClaimsByPerformanceLabel(claimsCollection);
    console.log("\nPending claims count by P1–U4 status labels:");
    console.table(pendingClaimsByBucket);

    const dealsByStatus = await getDealsCountByStatus(dealsCollection);
    console.log("\nDeals count by status:");
    console.table(dealsByStatus);
  } catch (error) {
    console.error(`Failed to aggregate data in '${env.mongoDbName}'.`);
    console.error(error);
    throw error;
  } finally {
    await client.close();
  }
}
