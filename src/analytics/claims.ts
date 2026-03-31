import { Collection, Document } from "mongodb";

export async function getClaimsCountByStatus(claimsCollection: Collection<Document>) {
  return claimsCollection
    .aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();
}

export async function getPendingClaimsByPerformanceLabel(
  claimsCollection: Collection<Document>,
  today: Date = new Date()
) {
  return claimsCollection
    .aggregate([
      { $match: { status: "Pending" } },
      {
        $addFields: {
          daysLate: {
            $floor: {
              $divide: [{ $subtract: [today, "$firstSubmissionDate"] }, 1000 * 60 * 60 * 24]
            }
          }
        }
      },
      {
        $addFields: {
          statusLabel: {
            $switch: {
              branches: [
                { case: { $lte: ["$daysLate", 1] }, then: "P1 - Current — Performing" },
                {
                  case: { $and: [{ $gt: ["$daysLate", 1] }, { $lte: ["$daysLate", 30] }] },
                  then: "U1 - Overdue 1–30 Days"
                },
                {
                  case: { $and: [{ $gt: ["$daysLate", 30] }, { $lte: ["$daysLate", 60] }] },
                  then: "U2 - Overdue 31–60 Days"
                },
                {
                  case: { $and: [{ $gt: ["$daysLate", 60] }, { $lte: ["$daysLate", 90] }] },
                  then: "U3 - Overdue 61–90 Days"
                },
                { case: { $gt: ["$daysLate", 90] }, then: "U4 - Overdue > 90 Days" }
              ],
              default: "Unknown"
            }
          }
        }
      },
      { $group: { _id: "$statusLabel", count: { $sum: 1 } } },
      {
        $addFields: {
          order: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", "P1 - Current — Performing"] }, then: 1 },
                { case: { $eq: ["$_id", "P2 - Current — Watch"] }, then: 2 },
                { case: { $eq: ["$_id", "U1 - Overdue 1–30 Days"] }, then: 3 },
                { case: { $eq: ["$_id", "U2 - Overdue 31–60 Days"] }, then: 4 },
                { case: { $eq: ["$_id", "U3 - Overdue 61–90 Days"] }, then: 5 },
                { case: { $eq: ["$_id", "U4 - Overdue > 90 Days"] }, then: 6 }
              ],
              default: 99
            }
          }
        }
      },
      { $sort: { order: 1 } },
      { $project: { order: 0 } }
    ])
    .toArray();
}
