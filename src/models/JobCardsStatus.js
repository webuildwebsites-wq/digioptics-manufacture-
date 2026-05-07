import mongoose from "mongoose";

const jobCardsStatusSchema = new mongoose.Schema(
    {

        jobCardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobCard",
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            default: 0,
        },
        transactionType: {
            type: String,
            enum: ["", "CASH", "CARD", "UPI", "NA"],
        },
        lensDeliveryDate: {
            type: Date,
        },
        paymentDelayDate: {
            type: Date,
        },
        statusNote: {
            type: String,
        },
        status: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("JobCardsStatus", jobCardsStatusSchema);