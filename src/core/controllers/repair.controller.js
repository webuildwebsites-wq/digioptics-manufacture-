import mongoose from "mongoose";

import Repair from "../../models/Repair.model.js";

// import { uploadToGCSRepair } from "../utils/uploadToGCS.js";


/* =====================================================
   CREATE REPAIR
===================================================== */



export const createRepair = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        let { name, mobile, email, item, issue, deliveryDate, price, remark } = req.body;

        if (!name) throw new Error("Customer name is required");
        if (!mobile) throw new Error("Mobile number is required");
        if (!item) throw new Error("Item name is required");

        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(mobile)) {
            throw new Error("Invalid mobile number");
        }

        price = Number(price) || 0;
        if (price < 0) {
            throw new Error("Price cannot be negative");
        }

        if (deliveryDate) {
            deliveryDate = new Date(deliveryDate);
        }

        /* =============================
           IMAGE UPLOAD (before txn ideally)
        ============================== */
        let images = [];

        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => uploadToGCSRepair(file));
            const uploadedImages = await Promise.all(uploadPromises);
            images = uploadedImages.map(img => img.publicUrl || img);
        }

        /* =============================
           FIND OR CREATE CUSTOMER
        ============================== */
        const cname = name.trim().toUpperCase();
        const cmobile = mobile.trim();


        /* =============================
           CREATE REPAIR
        ============================== */
        const repairRes = await Repair.create(
            [
                {

                    name: cname,
                    mobile: cmobile,
                    email,

                    item,
                    issue,
                    deliveryDate,
                    price,
                    images,
                    remark,

                },
            ],
            { session }
        );

        const repair = repairRes[0];

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Repair created successfully",
            repair,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Create Repair Error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/* =====================================================
   FILTER REPAIRS
===================================================== */

export const filterRepairs = async (req, res) => {
    try {

        const { startDate, endDate, keyword } = req.body;

        if (!startDate && !keyword) {
            return res.status(400).json({
                success: false,
                message: "Date range or keyword is required",
            });
        }

        let query = {};


        /* ---------- DATE FILTER ---------- */

        if (startDate && endDate) {

            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            query.repairDate = {
                $gte: start,
                $lte: end,
            };
        }


        /* ---------- KEYWORD FILTER ---------- */

        if (keyword) {

            const regex = new RegExp(keyword, "i");

            query.$or = [
                { name: regex },
                { mobile: regex },
                { email: regex },
                { item: regex },
                { issue: regex },
            ];
        }


        const repairsData = await Repair.find(query)
            .sort({ repairDate: -1 });


        if (!repairsData.length) {
            return res.status(200).json({
                success: false,
                message: "No repair records found with this filter",
            });
        }


        return res.status(200).json({
            success: true,
            total: repairsData.length,
            repairsData
        });

    } catch (error) {

        console.error("Filter Repairs Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



/* =====================================================
   GET REPAIRS (PAGINATION)
===================================================== */

export const getRepairs = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;


        const repairs = await Repair.find()
            .sort({ repairDate: -1 })
            .skip(skip)
            .limit(limit);

        const totalRepairs = await Repair.countDocuments();

        res.status(200).json({
            success: true,
            page,
            limit,
            total: totalRepairs,
            count: repairs.length,
            hasMore: skip + repairs.length < totalRepairs,
            repairs,
        });

    } catch (error) {

        console.error("Get Repairs Error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



/* =====================================================
   GET SINGLE REPAIR
===================================================== */

export const getSingleRepair = async (req, res) => {
    try {
        const { _id } = req.params;

        const repair = await Repair.findById(_id);

        if (!repair) {
            return res.status(404).json({
                success: false,
                message: "Repair not found",
            });
        }

        res.status(200).json({
            success: true,
            repair,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



/* =====================================================
   UPDATE REPAIR
===================================================== */

export const updateRepair = async (req, res) => {
    try {
        const { _id } = req.params;

        const repair = await Repair.findByIdAndUpdate(
            _id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!repair) {
            return res.status(404).json({
                success: false,
                message: "Repair not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Repair updated successfully",
            repair,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



/* =====================================================
   UPDATE REPAIR STATUS
===================================================== */

export const updateRepairStatus = async (req, res) => {
    try {

        const { _id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const repair = await Repair.findOne({
            _id,
        });

        if (!repair) {
            return res.status(404).json({
                success: false,
                message: "Repair not found"
            });
        }

        repair.status = status;

        if (status === "Completed") {
            repair.deliveredDate = new Date();
        }

        await repair.save();

        res.status(200).json({
            success: true,
            message: "Repair status updated",
            repair
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};



/* =====================================================
   DELETE REPAIR
===================================================== */
export const deleteRepair = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { _id } = req.params;

        const repair = await Repair.findOne(
            { _id }
        ).session(session);

        if (!repair) {
            throw new Error("Repair not found");
        }

        /* =============================
           Delete Repair
        ============================== */
        await repair.deleteOne({ session });


        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Repair deleted successfully",
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};