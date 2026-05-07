import express from "express";


import {
  createRepair,
  deleteRepair,
  getSingleRepair,
  updateRepair,
  updateRepairStatus,
  filterRepairs,
  getRepairs,
} from "../core/controllers/repair.controller.js";

const router = express.Router();



// Protect all repair routes
// router.use(isLoggedIn);


// Create repair
router.post("/", createRepair);

// Get repairs list
router.post("/search", filterRepairs);

// Get all repairs (allow ADMIN or STAFF only)
router.get("/", getRepairs);

// Get single repair
router.get("/:_id", getSingleRepair);

// Update repair
router.put("/:_id", updateRepair);

// Update repair status
router.patch("/:_id/status", updateRepairStatus);

// Delete repair
router.delete("/:_id", deleteRepair);

export default router;