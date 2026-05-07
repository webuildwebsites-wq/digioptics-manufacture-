import express from "express";
const router = express.Router();

import {
    createVendor, getAllVendors, getVendorById, updateVendor, deleteVendor, filterVendors, suggestionVendors
} from "../core/controllers/vendor.controller.js";

// Create vendor
router.post("/", createVendor);

// GET /api/vendor/suggestion?q=john  → search by name or mobile (max 5)
router.get("/suggestion", suggestionVendors);

// Get all vendors
router.get("/", getAllVendors);

// Get vendor by ID
router.get("/:_id", getVendorById);

// Update vendor
router.put("/:_id", updateVendor);

// Delete vendor (ADMIN only)
router.delete("/:_id", deleteVendor);

// fiter vendors by date range and keyword
router.post("/search", filterVendors);

export default router;
