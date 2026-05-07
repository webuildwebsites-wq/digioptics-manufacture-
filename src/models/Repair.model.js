import mongoose from "mongoose";

const repairSchema = new mongoose.Schema(
    {

        name: {
            type: String,
            required: true,
            trim: true
        },

        mobile: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        email: {
            type: String,
            trim: true
        },

        item: {
            type: String,
            required: true
        },

        issue: {
            type: String
        },

        deliveryDate: {
            type: Date
        },

        deliveredDate: {
            type: Date
        },

        price: {
            type: Number,
            default: 0
        },

        images: [{ type: String }], // multiple image URLs


        repairDate: {
            type: Date,
            default: Date.now,
            index: true
        },

        status: {
            type: String,
            enum: ["Pending", "In Progress", "Completed", "Cancelled"],
            default: "Pending",
            index: true
        },

        remark: {
            type: String
        },
    },
    { timestamps: true }
);

export default mongoose.model("Repair", repairSchema);