// const mongoose = require("mongoose");
import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    // storeId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Store",
    //   required: true,
    //   index: true,
    // },

    // storeNumber: {
    //   type: String,
    //   required: true,
    // },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productCode: {
      type: String,
      required: true,
      trim: true
    },
    
    qty: {
        type: Number,
        required: true,
        min: 1,
    },

    expiry: {
      type: Date,
    },

    price: {
      type: Number,
      min: 0,
    },

    gst: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    mrp: {
      type: Number,
      required: true,
      min: 0,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null
    },

    vendorName: {
      type: String,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// module.exports = mongoose.model("Inventory", inventorySchema);
const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;