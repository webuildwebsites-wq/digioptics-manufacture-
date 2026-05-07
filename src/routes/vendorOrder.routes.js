import express from "express";
const router = express.Router();

import {
    createVendorOrder, getVendorOrderById, updateVendorOrderStatus, getVendorOrders, deleteVendorOrder, updateVendorOrderIssues, filterVendorsOrders, suggestionVendorOrder
} from "../core/controllers/vendorOrder.controller.js";

// create new vendor order
router.post("/", createVendorOrder);


// GET /api/vendor-order/search?q=john  → search by name or mobile (max 5)
router.get("/suggestion", suggestionVendorOrder);

// get all vendor orders
router.get("/", getVendorOrders);

// get order by id
router.get("/:_id", getVendorOrderById);

// update order status
router.put("/:_id/status", updateVendorOrderStatus);


// delete order
router.delete("/:_id", deleteVendorOrder);

// update product status damage or missing qty
router.put("/issues/:_id", updateVendorOrderIssues);

// fiter vendors order by date range and keyword
router.post("/search", filterVendorsOrders);

export default router;