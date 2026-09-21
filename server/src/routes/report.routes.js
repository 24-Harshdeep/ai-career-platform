const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { getCareerReport, downloadReportPdf, getReportSummary, getSnapshots, createSnapshot } = require("../controllers/report.controller");

// GET /api/career/report
router.get("/", authMiddleware, getCareerReport);

// GET /api/career/report/pdf
router.get("/pdf", authMiddleware, downloadReportPdf);

// GET /api/career/report/summary
router.get("/summary", authMiddleware, getReportSummary);

// GET /api/career/report/snapshots
router.get("/snapshots", authMiddleware, getSnapshots);

// POST /api/career/report/snapshot
router.post("/snapshot", authMiddleware, createSnapshot);

module.exports = router;
