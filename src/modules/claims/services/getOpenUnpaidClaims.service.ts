import { getClaimsCollection } from "../../core/db/mongodb";

interface GetOpenUnpaidClaimsParams {
  page: number;
  limit: number;
}

export async function getOpenUnpaidClaimsService({
  page,
  limit
}: GetOpenUnpaidClaimsParams) {
  if (page <= 0 || !Number.isInteger(page)) {
    throw new Error("Page must be a positive integer");
  }

  if (limit <= 0 || !Number.isInteger(limit)) {
    throw new Error("Limit must be a positive integer");
  }

  const claimsCollection = await getClaimsCollection();
  const filter = {
    $expr: {
      $and: [
        {
          $lt: [
            {
              $round: [
                { $ifNull: ["$collectionData.collected", 0] },
                2
              ]
            },
            {
              $round: [
                { $ifNull: ["$netAmount", 0] },
                2
              ]
            }
          ]
        },
        {
          $lt: [
            {
              $round: [
                { $ifNull: ["$collectionData.collectedOwner", 0] },
                2
              ]
            },
            {
              $round: [
                { $ifNull: ["$netAmount", 0] },
                2
              ]
            }
          ]
        },
        {
          $lt: [
            {
              $round: [
                { $ifNull: ["$firstRejectedAmount", 0] },
                2
              ]
            },
            {
              $round: [
                { $ifNull: ["$netAmount", 0] },
                2
              ]
            }
          ]
        }
      ]
    }
  };
  const skip = (page - 1) * limit;

  const [totalClaims, claims] = await Promise.all([
    claimsCollection.countDocuments(filter),
    claimsCollection
      .find(filter)
      .skip(skip)
      .limit(limit)
      .toArray()
  ]);

  return {
    totalClaims,
    page,
    limit,
    totalPages: totalClaims === 0 ? 0 : Math.ceil(totalClaims / limit),
    claimsCount: claims.length,
    claims
  };
}
