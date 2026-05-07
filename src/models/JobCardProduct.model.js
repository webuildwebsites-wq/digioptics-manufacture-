import mongoose from "mongoose";

const jobCardProductSchema = new mongoose.Schema(
    {
        jobCardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobCard",
            required: true,
            index: true,
        },


        productCode: {
            type: String,
        },

        category: {
            type: String,
            required: true
        },

        otherCategory: {
            type: String,
        },

        productName: {
            type: String,
        },

        otherProductName: {
            type: String,
        },


        hsnSac: String,

        quantity: {
            type: Number,
            min: 1,
            required: true,
        },

        cost: {
            type: Number,
            default: 0,
            min: 0
        },

        image: {
            type: String,
            default: ""
        },

        price: {
            type: Number,
            required: true,
        },

        discount: {
            type: Number,
            default: 0,
        },

        discountPercent: {
            type: Number,
            default: 0,
        },

        gstType: {
            type: String,
            enum: ["INCLUDED", "EXCLUDED"],
            required: true,
        },

        gstMode: {
            type: String,
            enum: ["CGST/SGST", "IGST"],
            required: true,
        },

        gstPercent: {
            type: Number,
            default: 0,
        },

        gstAmount: {
            type: Number,
            default: 0,
        },

        cgst: {
            type: Number,
            default: 0,
        },

        sgst: {
            type: Number,
            default: 0,
        },

        igst: {
            type: Number,
            default: 0,
        },

        subtotal: {
            type: Number,
            required: true,
        },

        total: {
            type: Number,
            required: true,
        },

        lensAvailibility: {
            type: String,
            enum: ["", "INHOUSE", "ORDER"],
        },

        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
        },

        vendorName: String,

        productImage: String,

        bookedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        bookedByName: {
            type: String,
        },

        commissionPercent: {
            type: Number,
            default: 0,
        },

        commissionAmount: {
            type: Number,
            default: 0,
        },
        

        productKey: {
            type: String,
            default: ""
        },

        isFreeItem: {
            type: Boolean,
            default: false,
        },

        bogoGroupId: {
            type: String,
            default: null,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export default mongoose.model("JobCardProduct", jobCardProductSchema);
