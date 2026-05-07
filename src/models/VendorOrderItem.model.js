import mongoose from "mongoose";

const vendorOrderItemSchema = new mongoose.Schema(
    {
        vendorOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VendorOrder",
            required: true,
        },

        productCode: {
            type: String,
            required: true,
        },

        productName: {
            type: String,
            required: true,
            uppercase: true,
        },

        category: String,

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        subTotal: {
            type: Number,
            required: true,
            min: 0,
        },

        gstPercent: {
            type: Number,
            required: true,
            min: 0,
        },

        gstAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        total: {
            type: Number,
            required: true,
            min: 0,
        },

        expectedDate: {
            type: Date,
            required: true,
        },

        damageQty: {
            type: Number,
            min: 0,
        },

        missingQty: {
            type: Number,
            min: 0,
        },

        remark: {
            type: String,
        },

    },
    { timestamps: true }
);

export default mongoose.model("VendorOrderItem", vendorOrderItemSchema);
