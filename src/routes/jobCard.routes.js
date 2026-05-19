import express from "express";
import { ProtectUser } from "../middlewares/Auth/AdminMiddleware/adminMiddleware.js";
import { getDailyReportData, getMainReportData } from "../core/controllers/jobCard.controller.js";

const router = express.Router();


// Main Report
router.post("/report/main", ProtectUser, getMainReportData);


// Daily Report
router.post("/report/daily", ProtectUser, getDailyReportData);


export default router;