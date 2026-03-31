import { Collection, Document } from "mongodb";

export async function getDealsCountByStatus(dealsCollection: Collection<Document>) {
  return dealsCollection
    .aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();
}
