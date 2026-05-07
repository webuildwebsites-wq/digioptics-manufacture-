import mongoose from "mongoose";

const jobCardSchema = new mongoose.Schema(
    {

        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
        },

        name: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        mobile: {
            type: String,
            required: true,
        },
        email: String,
        address: String,

        dob: {
            type: Date,
        },
        anniversary: {
            type: Date,
        },

        orderDate: {
            type: Date,
            default: Date.now,
        },

        billNo: {
            type: String,
        },

        // expecting delivery date
        deliveryDate: {
            type: Date,
        },

        // Actual delivered date
        deliveredDate: {
            type: Date,
        },

        testedBy: {
            type: String,
            enum: ["SELF", "OUTSIDE", "NONE"],
            default: "NONE",
        },

        testedByName: {
            type: String,
        },

        referredByType: {
            type: String,
            enum: ["DOCTOR", "CUSTOMER", "NONE"],
            default: "NONE",
        },
        referName: String,
        referMobile: String,

        subTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        additionalDiscount: {
            type: Number,
            default: 0,
            min: 0,
        },
        loyaltyDiscount: {
            type: Number,
            default: 0,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },

        advance: {
            type: Number,
            default: 0,
            min: 0,
        },
        balance: {
            type: Number,
            min: 0,
        },

        transactionType: {
            type: String,
            enum: ["CASH", "CARD", "UPI", "NA", "MIXED"],
            required: true,
        },

        loyaltyPointsUsed: {
            type: Number,
            default: 0,
            min: 0,
        },

        remark: String,

        earnedLoyaltyPoints: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            default: "Active",
            enum: ["Active", "Draft", "Delivered", "Cancelled"]
        },

        pstatus: {
            type: String,
            default: "In-process",
            enum: ["In-process", "Draft", "Lens Ordered", "Lens Received", "Lens Checked for Fitting", "Fitting Process", "Fitting Issue", "Fitting Done", "Fitting Checked", "Fitting QC Failed", "Ready To Deliver", "Delivered", "Holiday Closed", "Urgent Talk", "Delay Delivery", "Payment Delay", "JC Feed", "JC Cross Checked", "Cancelled"]
        },


        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export default mongoose.model("JobCard", jobCardSchema);