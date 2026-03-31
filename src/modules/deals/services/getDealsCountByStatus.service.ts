import { getDealsCollection } from "../../core/db/mongodb";

export async function getDealsCountByStatusService() {
  const dealsCollection = await getDealsCollection();

  return dealsCollection
    .aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();
}
