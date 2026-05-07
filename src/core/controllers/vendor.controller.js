import mongoose from "mongoose";

import Vendor from "../../models/Vendor.model.js";


// create vendor
export const createVendor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      firm,
      mobile,
      email,
      address,
      gstNumber,
      paymentTerms,
      notes,
    } = req.body;

    if (!name || !firm || !mobile || !email) {
      throw new Error("Vendor name, firm, email and mobile are required");
    }

    const firmName = firm.trim().toUpperCase();
    const vendorName = name.trim().toUpperCase();

    const existingVendor = await Vendor.findOne({
      mobile,
      firm: firmName,
    }).session(session);

    if (existingVendor) {
      throw new Error("Vendor with same firm name and mobile already exists");
    }

    const vendor = new Vendor({
      name: vendorName,
      firm: firmName,
      mobile,
      email,
      address,
      gstNumber,
      paymentTerms,
      notes,
    });

    await vendor.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      vendor,
    });

  } catch (error) {
    // 🔥 IMPORTANT FIX
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// ─────────────────────────────────────────────────────────────────
//  GET /api/vendor/suggestion?q=<name or mobile>
//  Returns up to 5 matching vendor
// ─────────────────────────────────────────────────────────────────
export const suggestionVendors = async (req, res) => {
  try {


    const q = (req.query.q || "").trim();

    if (!q || q.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Query must be at least 3 characters.",
      });
    }

    const vendors = await Vendor.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { mobile: { $regex: q, $options: "i" } },
      ],
    })
      .select("name mobile email address")
      .limit(5)
      .lean();

    return res.status(200).json({
      success: true,
      data: vendors,
    });

  } catch (err) {

    console.error("searchVedors error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });

  }
};

// get all vendor of a store
export const getAllVendors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;   // current page
    const limit = parseInt(req.query.limit) || 20; // items per load
    const skip = (page - 1) * limit;

    const filter = {
    };

    const vendors = await Vendor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalVendors = await Vendor.countDocuments(filter);

    res.status(200).json({
      success: true,
      page,
      limit,
      total: totalVendors,
      count: vendors.length,
      hasMore: skip + vendors.length < totalVendors,
      vendors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get vendor by id
export const getVendorById = async (req, res) => {
  try {
    const { _id } = req.params;

    const vendor = await Vendor.findById(_id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vendor found successfully",
      vendor,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// update vendor data
export const updateVendor = async (req, res) => {
  try {
    const { _id } = req.params;

    const vendor = await Vendor.findById(_id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const fields = [
      "name",
      "firm",
      "mobile",
      "email",
      "address",
      "gstNumber",
      "paymentTerms",
      "notes",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        vendor[field] = req.body[field];
      }
    });

    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Vendor updated successfully",
      vendor,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// delete vendor by id
export const deleteVendor = async (req, res) => {
  try {
    const { _id } = req.params;

    const vendor = await Vendor.findByIdAndDelete(_id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// get vendors data by date range or by keyword
export const filterVendors = async (req, res) => {
  try {
    const { startDate, endDate, keyword } = req.body;


    /* =========================================
       VALIDATION
    ========================================= */

    if (!startDate && !keyword) {
      return res.status(400).json({
        success: false,
        message: "Date range or keyword is required",
      });
    }

    let query = {
    };

    /* =========================================
       DATE RANGE FILTER
    ========================================= */

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    /* =========================================
       KEYWORD FILTER
    ========================================= */

    if (keyword) {
      const regex = new RegExp(keyword, "i");

      query.$or = [
        { name: regex },
        { mobile: regex },
        { email: regex },
        { address: regex },
        { firm: regex },
        { gstNumber: regex },
      ];
    }

    /* =========================================
       FETCH DATA
    ========================================= */

    const vendorsData = await Vendor.find(query).sort({ createdAt: -1 });

    if (!vendorsData.length) {
      return res.status(200).json({
        success: false,
        message: "No data exist with this date/keyword filter",
      });
    }

    return res.status(200).json({
      success: true,
      total: vendorsData.length,
      vendors: vendorsData,
    });

  } catch (error) {
    console.error("Filter Vendors Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};