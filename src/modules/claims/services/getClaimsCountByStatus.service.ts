import { getClaimsCollection } from "../../core/db/mongodb";

export async function getClaimsCountByStatusService() {
  const claimsCollection = await getClaimsCollection();

  return claimsCollection
    .aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();
}
