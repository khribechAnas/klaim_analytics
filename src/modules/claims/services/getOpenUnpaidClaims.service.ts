import { getClaimsCollection } from "../../core/db/mongodb";
import { ClassificationCode } from "../classification.types";

interface GetOpenUnpaidClaimsParams {
  page: number;
  limit: number;
  classificationCodes?: ClassificationCode[];
}

interface ClassifiedClaimsWithSummaryResult {
  totalClaims: number;
  page: number;
  limit: number;
  totalPages: number;
  claimsCount: number;
  claims: Record<string, unknown>[];
  globalSummary: ClassificationSummary;
}

const openUnpaidClaimsFilter = {
  status: "Pending",
  $expr: {
    $and: [
      {
        $lt: [{ $ifNull: ["$collectionData.collected", 0] }, { $ifNull: ["$netAmount", 0] }]
      },
      {
        $lt: [{ $ifNull: ["$collectionData.collectedOwner", 0] }, { $ifNull: ["$netAmount", 0] }]
      },
      {
        $lt: [{ $ifNull: ["$firstRejectedAmount", 0] }, { $ifNull: ["$netAmount", 0] }]
      }
    ]
  }
};

type ClassificationSummary = Record<ClassificationCode, { count: number; totalNetAmount: number }>;

function createEmptyClassificationSummary(): ClassificationSummary {
  return {
    P1: { count: 0, totalNetAmount: 0 },
    U1: { count: 0, totalNetAmount: 0 },
    U2: { count: 0, totalNetAmount: 0 },
    U3: { count: 0, totalNetAmount: 0 },
    U4: { count: 0, totalNetAmount: 0 }
  };
}

function mapAggregationSummary(
  aggregationResult: Array<{
    _id: ClassificationCode;
    count: number;
    totalNetAmount: number;
  }>
): ClassificationSummary {
  const summary = createEmptyClassificationSummary();

  aggregationResult.forEach(({ _id, count, totalNetAmount }) => {
    summary[_id] = {
      count,
      totalNetAmount
    };
  });

  return summary;
}

function createGlobalSummaryAggregationStages() {
  return [
    {
      $project: {
        normalizedNetAmount: { $ifNull: ["$netAmount", 0] },
        dueDate: {
          $let: {
            vars: {
              paymentDates: {
                $map: {
                  input: { $ifNull: ["$expectedCfs.payment", []] },
                  as: "payment",
                  in: {
                    $convert: {
                      input: "$$payment.date",
                      to: "date",
                      onError: null,
                      onNull: null
                    }
                  }
                }
              }
            },
            in: {
              $max: {
                $filter: {
                  input: "$$paymentDates",
                  as: "paymentDate",
                  cond: { $ne: ["$$paymentDate", null] }
                }
              }
            }
          }
        }
      }
    },
    {
      $project: {
        normalizedNetAmount: 1,
        daysOverdue: {
          $cond: [
            { $eq: ["$dueDate", null] },
            -1,
            {
              $max: [
                {
                  $floor: {
                    $divide: [{ $subtract: ["$$NOW", "$dueDate"] }, 1000 * 60 * 60 * 24]
                  }
                },
                0
              ]
            }
          ]
        }
      }
    },
    {
      $project: {
        normalizedNetAmount: 1,
        classificationCode: {
          $switch: {
            branches: [
              { case: { $lte: ["$daysOverdue", 0] }, then: "P1" },
              { case: { $lte: ["$daysOverdue", 30] }, then: "U1" },
              { case: { $lte: ["$daysOverdue", 60] }, then: "U2" },
              { case: { $lte: ["$daysOverdue", 90] }, then: "U3" }
            ],
            default: "U4"
          }
        }
      }
    },
    {
      $group: {
        _id: "$classificationCode",
        count: { $sum: 1 },
        totalNetAmount: { $sum: "$normalizedNetAmount" }
      }
    },
    {
      $project: {
        _id: 1,
        count: 1,
        totalNetAmount: { $round: ["$totalNetAmount", 2] }
      }
    }
  ];
}

export async function getAllOpenUnpaidClaimsService() {
  const claimsCollection = await getClaimsCollection();

  return claimsCollection.find(openUnpaidClaimsFilter).toArray();
}

export async function getPendingClaimsCountService() {
  const claimsCollection = await getClaimsCollection();

  return claimsCollection.countDocuments(openUnpaidClaimsFilter);
}

export async function getOpenUnpaidClaimsClassificationSummary(): Promise<ClassificationSummary> {
  const claimsCollection = await getClaimsCollection();

  const aggregationResult = await claimsCollection
    .aggregate<{
      _id: ClassificationCode;
      count: number;
      totalNetAmount: number;
    }>([{ $match: openUnpaidClaimsFilter }, ...createGlobalSummaryAggregationStages()])
    .toArray();

  return mapAggregationSummary(aggregationResult);
}

export async function getClassifiedOpenUnpaidClaimsService({
  page,
  limit,
  classificationCodes
}: GetOpenUnpaidClaimsParams): Promise<ClassifiedClaimsWithSummaryResult> {
  if (page <= 0 || !Number.isInteger(page)) {
    throw new Error("Page must be a positive integer");
  }

  if (limit <= 0 || !Number.isInteger(limit)) {
    throw new Error("Limit must be a positive integer");
  }

  const claimsCollection = await getClaimsCollection();
  const skip = (page - 1) * limit;
  const hasClassificationFilter = Array.isArray(classificationCodes) && classificationCodes.length > 0;

  const classificationComputationStages = [
    {
      $addFields: {
        dueDate: {
          $let: {
            vars: {
              paymentDates: {
                $map: {
                  input: { $ifNull: ["$expectedCfs.payment", []] },
                  as: "payment",
                  in: {
                    $convert: {
                      input: "$$payment.date",
                      to: "date",
                      onError: null,
                      onNull: null
                    }
                  }
                }
              }
            },
            in: {
              $max: {
                $filter: {
                  input: "$$paymentDates",
                  as: "paymentDate",
                  cond: { $ne: ["$$paymentDate", null] }
                }
              }
            }
          }
        }
      }
    },
    {
      $addFields: {
        daysOverdue: {
          $cond: [
            { $eq: ["$dueDate", null] },
            -1,
            {
              $max: [
                {
                  $floor: {
                    $divide: [{ $subtract: ["$$NOW", "$dueDate"] }, 1000 * 60 * 60 * 24]
                  }
                },
                0
              ]
            }
          ]
        }
      }
    },
    {
      $addFields: {
        classificationCode: {
          $switch: {
            branches: [
              { case: { $lte: ["$daysOverdue", 0] }, then: "P1" },
              { case: { $lte: ["$daysOverdue", 30] }, then: "U1" },
              { case: { $lte: ["$daysOverdue", 60] }, then: "U2" },
              { case: { $lte: ["$daysOverdue", 90] }, then: "U3" }
            ],
            default: "U4"
          }
        }
      }
    }
  ];

  const [result] = await claimsCollection
    .aggregate<{
      metadata: Array<{ totalClaims: number }>;
      claims: Record<string, unknown>[];
      globalSummary: Array<{
        _id: ClassificationCode;
        count: number;
        totalNetAmount: number;
      }>;
    }>([
      { $match: openUnpaidClaimsFilter },
      ...classificationComputationStages,
      ...(hasClassificationFilter
        ? [{ $match: { classificationCode: { $in: classificationCodes } } }]
        : []),
      {
        $facet: {
          metadata: [{ $count: "totalClaims" }],
          claims: [
            {
              $project: {
                dueDate: 0,
                daysOverdue: 0,
                classificationCode: 0
              }
            },
            { $skip: skip },
            { $limit: limit }
          ],
          globalSummary: [
            {
              $group: {
                _id: "$classificationCode",
                count: { $sum: 1 },
                totalNetAmount: { $sum: { $ifNull: ["$netAmount", 0] } }
              }
            },
            {
              $project: {
                _id: 1,
                count: 1,
                totalNetAmount: { $round: ["$totalNetAmount", 2] }
              }
            }
          ]
        }
      }
    ])
    .toArray();

  const totalClaims = result?.metadata[0]?.totalClaims ?? 0;
  const claims = result?.claims ?? [];
  const globalSummary = mapAggregationSummary(result?.globalSummary ?? []);

  return {
    totalClaims,
    page,
    limit,
    totalPages: totalClaims === 0 ? 0 : Math.ceil(totalClaims / limit),
    claimsCount: claims.length,
    claims,
    globalSummary
  };
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
  const skip = (page - 1) * limit;

  const [totalClaims, claims] = await Promise.all([
    claimsCollection.countDocuments(openUnpaidClaimsFilter),
    claimsCollection
      .find(openUnpaidClaimsFilter, {
        projection: {
          claimId: 1,
          netAmount: 1,
          expectedCfs: {
            payment: 1
          }
        }
      })
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
