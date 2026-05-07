import mongoose from "mongoose";

import JobCard from "../../../models/JobCard/JobCard.model.js";
import JobCardProduct from "../../../models/JobCard/JobCardProduct.model.js";
import JobCardPrescription from "../../../models/JobCard/JobCardPrescription.model.js";
import User from "../../../models/User/User.model.js";
import Customer from "../../../models/Customer/Customer.model.js";
import Product from "../../../models/Product/Product.model.js";
import StoreIdsModel from "../../../models/Store/StoreIds.model.js";



export const getMainReportData = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);


    /* =====================================================
       CREATED DATE JOBCARDS (DATA + TOTALS)
    ====================================================== */

    const [jobCards, createdTotals] = await Promise.all([
      JobCard.find({
        createdAt: { $gte: start, $lte: end },
      })
        .sort({ createdAt: -1 })
        .lean(),

      JobCard.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            totalJobCards: { $sum: 1 },
            totalAdvance: { $sum: "$advance" },
            totalBalance: { $sum: "$balance" },
            ids: { $push: "$_id" },
          },
        },
      ]),
    ]);

    const createdSummary = createdTotals[0] || {
      totalJobCards: 0,
      totalAdvance: 0,
      totalBalance: 0,
      ids: [],
    };

    const jobCardIds = createdSummary.ids;

    /* =====================================================
       DELIVERED DATE JOBCARDS (DATA + TOTALS)
    ====================================================== */

    const [deliveredJobCards, deliveredTotals] = await Promise.all([
      JobCard.find({
        status: "Delivered",
        deliveryDate: { $gte: start, $lte: end },
      })
        .sort({ deliveryDate: -1 })
        .lean(),

      JobCard.aggregate([
        {
          $match: {
            status: "Delivered",
            deliveryDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            deliveredCount: { $sum: 1 },
            deliveredTotalSum: { $sum: "$total" },
            ids: { $push: "$_id" },
          },
        },
      ]),
    ]);

    const deliveredSummary = deliveredTotals[0] || {
      deliveredCount: 0,
      deliveredTotalSum: 0,
      ids: [],
    };

    const deliveredIds = deliveredSummary.ids;

    /* =====================================================
       PARALLEL QUERIES (COMMISSION + TRANSACTION + BALANCE)
    ====================================================== */

    const [
      commissionByCreated,
      commissionByDelivered,
      transactionData,
      deliveredBalanceData,
    ] = await Promise.all([
      // Commission by created date
      jobCardIds.length
        ? JobCardProduct.aggregate([
          {
            $match: {
              jobCardId: { $in: jobCardIds },
              commissionAmount: { $gt: 0 },
              bookedBy: { $nin: ["", null] },
            },
          },
          {
            $group: {
              _id: "$bookedBy",
              bookedByName: { $first: "$bookedByName" },
              totalCommission: { $sum: "$commissionAmount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { totalCommission: -1 } },
        ])
        : [],

      // Commission by delivered date
      deliveredIds.length
        ? JobCardProduct.aggregate([
          {
            $match: {
              jobCardId: { $in: deliveredIds },
              commissionAmount: { $gt: 0 },
              bookedBy: { $nin: ["", null] },
            },
          },
          {
            $group: {
              _id: "$bookedBy",
              bookedByName: { $first: "$bookedByName" },
              totalCommission: { $sum: "$commissionAmount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { totalCommission: -1 } },
        ])
        : [],

      // Transaction Summary
      jobCardIds.length
        ? JobCardsStatus.aggregate([
          {
            $match: {
              jobCardId: { $in: jobCardIds },
              createdAt: { $gte: start, $lte: end },
              transactionType: { $ne: "" },
            },
          },
          {
            $group: {
              _id: "$transactionType",
              totalAmount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ])
        : [],

      // Delivered Balance
      deliveredIds.length
        ? JobCardsStatus.aggregate([
          {
            $match: {
              jobCardId: { $in: deliveredIds },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ])
        : [],
    ]);

    /* =====================================================
       FINAL CALCULATIONS
    ====================================================== */

    const totalCommissionCreated = commissionByCreated.reduce(
      (sum, s) => sum + s.totalCommission,
      0
    );

    const totalCommissionDelivered = commissionByDelivered.reduce(
      (sum, s) => sum + s.totalCommission,
      0
    );

    const deliveredJcBalanceReceived =
      deliveredBalanceData[0]?.total || 0;

    const transactionSummary = {};
    transactionData.forEach((t) => {
      transactionSummary[t._id] = {
        totalAmount: t.totalAmount,
        count: t.count,
      };
    });

    /* =====================================================
       RESPONSE
    ====================================================== */

    return res.status(200).json({
      success: true,

      // Created
      jobCards,
      totalJobCards: createdSummary.totalJobCards,
      totalAdvance: createdSummary.totalAdvance || 0,
      totalBalance: createdSummary.totalBalance || 0,

      // Delivered
      deliveredJobCards,
      deliveredCount: deliveredSummary.deliveredCount,
      deliveredTotalSum: deliveredSummary.deliveredTotalSum || 0,
      deliveredJcBalanceReceived,

      // Commission
      commissionByCreated,
      totalCommissionCreated,
      commissionByDelivered,
      totalCommissionDelivered,

      // Transactions
      transactionSummary,
    });

  } catch (error) {
    console.error("JobCard Report Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const getDailyReportData = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const storeObjectId = new mongoose.Types.ObjectId(storeId);

    const baseMatch = {
      createdAt: { $gte: start, $lte: end },
    };

    const [
      expenseResult,
      productResult,
      jobCardStatusResult,
      jobCardResult,
      salesResult,
      prescriptionResult,
    ] = await Promise.all([

      /* ===================== EXPENSES ===================== */
      Expense.aggregate([
        { $match: baseMatch },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  totalExpenseAmount: { $sum: "$amount" },
                  totalRecords: { $sum: 1 },
                },
              },
            ],
            data: [{ $sort: { createdAt: -1 } }],
          },
        },
      ]),

      /* ===================== PRODUCTS ===================== */
      JobCardProduct.aggregate([
        { $match: baseMatch },
        {
          $addFields: {
            finalCategory: {
              $cond: [
                { $eq: ["$category", "OTHER"] },
                { $concat: ["OTHER - ", "$otherCategory"] },
                "$category",
              ],
            },
            finalProductName: {
              $ifNull: ["$productName", "$otherProductName"],
            },
          },
        },
        {
          $facet: {
            data: [
              {
                $project: {
                  createdAt: 1,
                  quantity: 1,
                  price: 1,
                  cost: 1,
                  finalCategory: 1,
                  finalProductName: 1,
                },
              },
              { $sort: { createdAt: -1 } },
            ],
            categoryCount: [
              {
                $group: {
                  _id: "$finalCategory",
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]),

      /* ===================== JOBCARD STATUS ===================== */
      JobCardsStatus.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: "$transactionType",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      /* ===================== DELIVERED JOBCARDS + PRODUCT COST ===================== */
      JobCard.aggregate([
        {
          $match: {
            ...baseMatch,
            status: "Delivered",
          },
        },
        {
          $lookup: {
            from: "jobcardproducts", // confirm actual collection name
            localField: "_id",
            foreignField: "jobCardId",
            as: "products",
          },
        },
        {
          $facet: {

            summary: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$total" },
                  totalBalance: { $sum: "$balance" },
                  totalAdvance: { $sum: "$advance" },
                  totalCollected: {
                    $sum: {
                      $subtract: [
                        "$total",
                        {
                          $add: [
                            "$balance",
                            { $ifNull: ["$additionalDiscount", 0] },
                            { $ifNull: ["$loyaltyDiscount", 0] }
                          ]
                        }
                      ]
                    }
                  }
                }
              }
            ],

            productCostSummary: [
              { $unwind: "$products" },
              {
                $group: {
                  _id: null,
                  totalProductCost: {
                    $sum: {
                      $multiply: [
                        { $ifNull: ["$products.cost", 0] },
                        { $ifNull: ["$products.quantity", 1] }
                      ]
                    }
                  },
                  totalProducts: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),

      /* ===================== SALES ===================== */
      Sale.aggregate([
        { $match: baseMatch },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  totalSalesAmount: { $sum: "$amount" },
                  totalRecords: { $sum: 1 },
                },
              },
            ],
            transactionSummary: [
              {
                $group: {
                  _id: "$transactionType",
                  totalAmount: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
            data: [{ $sort: { createdAt: -1 } }],
          },
        },
      ]),

      /* ===================== PRESCRIPTIONS ===================== */
      Prescription.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]),

    ]);

    /* ===================== EXTRACT DATA ===================== */

    const expenseSummary = expenseResult[0]?.summary[0] || { totalExpenseAmount: 0, totalRecords: 0 };
    const expenseData = expenseResult[0]?.data || [];

    const productData = productResult[0]?.data || [];
    const categoryCount = productResult[0]?.categoryCount || [];

    const transactionTypeSummary = jobCardStatusResult || [];

    const jobCardData = jobCardResult[0] || {};

    const deliveredSummary = jobCardData.summary?.[0] || {
      count: 0,
      totalAmount: 0,
      totalBalance: 0,
      totalAdvance: 0,
      totalCollected: 0,
    };

    const deliveredProductCost = jobCardData.productCostSummary?.[0] || {
      totalProductCost: 0,
      totalProducts: 0,
    };

    const salesSummary = salesResult[0]?.summary[0] || { totalSalesAmount: 0, totalRecords: 0 };
    const salesTransactionSummary = salesResult[0]?.transactionSummary || [];
    const salesData = salesResult[0]?.data || [];

    const prescriptionSummary = prescriptionResult[0] || {
      totalRecords: 0,
      totalAmount: 0,
    };

    /* ===================== DASHBOARD CALCULATION ===================== */

    const netCollection =
      salesSummary.totalSalesAmount +
      deliveredSummary.totalCollected;

    const netProfit =
      netCollection -
      expenseSummary.totalExpenseAmount -
      deliveredProductCost.totalProductCost;

    /* ===================== RESPONSE ===================== */

    return res.status(200).json({
      success: true,
      dateRange: { startDate: start, endDate: end },

      expenses: {
        totalRecords: expenseSummary.totalRecords,
        totalExpenseAmount: expenseSummary.totalExpenseAmount,
        data: expenseData,
      },

      products: {
        totalRecords: productData.length,
        data: productData,
        categoryCount,
      },

      jobCardStatus: {
        transactionTypeSummary,
      },

      jobCards: {
        totalRecords: deliveredSummary.count,
        deliveredSummary,
        deliveredProductCost,
      },

      sales: {
        totalRecords: salesSummary.totalRecords,
        totalSalesAmount: salesSummary.totalSalesAmount,
        transactionSummary: salesTransactionSummary,
        data: salesData,
      },

      prescriptions: {
        totalRecords: prescriptionSummary.totalRecords,
        totalAmount: prescriptionSummary.totalAmount,
      },

      dashboardSummary: {
        netCollection,
        netProfit,
      },
    });

  } catch (error) {
    console.error("Full Business Report Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
