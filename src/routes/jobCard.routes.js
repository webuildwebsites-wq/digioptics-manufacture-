const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
// const {  getMainReportData, getDailyReportData } = require("../controllers/jobCard.controller");
const upload = require("../utils/multer");


// Protect all expense routes
router.use(isLoggedIn);


// Main Report
router.post("/report/main", authorizeRoles("ADMIN", "STAFF"), getMainReportData);


// Daily Report
router.post("/report/daily", authorizeRoles("ADMIN", "STAFF"), getDailyReportData);


module.exports = router;
