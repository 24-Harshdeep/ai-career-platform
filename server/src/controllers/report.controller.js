const { generateCareerIntelligenceReport, createCareerReportSnapshot } = require("../services/careerIntelligence.service");
const { buildCareerReportPdf } = require("../services/reportPdf.service");
const CareerReportSnapshot = require("../models/CareerReportSnapshot");

/**
 * GET /api/career/report
 * Fetches the complete Career Report DTO for specified mode ('shareable' | 'private').
 */
async function getCareerReport(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const mode = req.query.mode === "private" ? "private" : "shareable";
    const snapshotId = req.query.snapshotId;

    if (snapshotId) {
      const snapshot = await CareerReportSnapshot.findOne({ _id: snapshotId, userId });
      if (snapshot) {
        return res.status(200).json({
          success: true,
          report: snapshot.snapshotData,
          isSnapshot: true,
          snapshotId: snapshot._id,
          versionNumber: snapshot.versionNumber
        });
      }
    }

    const reportData = await generateCareerIntelligenceReport(userId, mode);
    return res.status(200).json({
      success: true,
      report: reportData,
      isSnapshot: false
    });
  } catch (err) {
    console.error("Error in getCareerReport controller:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to generate Career Intelligence Report"
    });
  }
}

/**
 * GET /api/career/report/pdf
 * Streams page-budgeted vector PDF download for specified mode ('shareable' | 'private').
 */
async function downloadReportPdf(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const mode = req.query.mode === "private" ? "private" : "shareable";
    const snapshotId = req.query.snapshotId;

    let reportData;
    if (snapshotId) {
      const snapshot = await CareerReportSnapshot.findOne({ _id: snapshotId, userId });
      if (snapshot) {
        reportData = snapshot.snapshotData;
      }
    }

    if (!reportData) {
      reportData = await generateCareerIntelligenceReport(userId, mode);
      // Asynchronously record snapshot if requested or default
      createCareerReportSnapshot(userId, mode).catch(e => console.error("Snapshot save error:", e.message));
    }

    const pdfBuffer = await buildCareerReportPdf(reportData);

    const safeRoleName = (reportData.targetRole || "Career").replace(/[^a-zA-Z0-9_-]/g, "_");
    const modeTag = mode === "private" ? "Private" : "Growth_Profile";
    const filename = `CareerOS_Report_${modeTag}_${safeRoleName}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    
    return res.end(pdfBuffer);
  } catch (err) {
    console.error("Error in downloadReportPdf controller:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to generate Report PDF"
    });
  }
}

/**
 * GET /api/career/report/summary
 * Returns lightweight report summary for profile/settings widgets.
 */
async function getReportSummary(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const reportData = await generateCareerIntelligenceReport(userId, "shareable");

    const activeGaps = reportData.skillGapLifecycle ? reportData.skillGapLifecycle.filter(g => g.status === "NEW" || g.status === "IN_PROGRESS" || g.status === "RECURRING").length : 0;
    const resolvedGaps = reportData.skillGapLifecycle ? reportData.skillGapLifecycle.filter(g => g.status === "RESOLVED" || g.status === "IMPROVING").length : 0;

    return res.status(200).json({
      success: true,
      summary: {
        targetRole: reportData.targetRole,
        careerGoal: reportData.careerGoal,
        careerScore: reportData.careerScore,
        jobReadiness: reportData.jobReadiness,
        confidence: reportData.confidence,
        growthText: reportData.growth.growthText,
        weeklyGrowth: reportData.growth.weeklyGrowth,
        activeGaps,
        resolvedGaps,
        generatedAt: reportData.generatedAt,
        nextBestAction: reportData.nextBestActions && reportData.nextBestActions.length > 0 ? reportData.nextBestActions[0].title : null
      }
    });
  } catch (err) {
    console.error("Error in getReportSummary controller:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch report summary"
    });
  }
}

/**
 * GET /api/career/report/snapshots
 * Returns all historical snapshots for candidate.
 */
async function getSnapshots(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const snapshots = await CareerReportSnapshot.find({ userId })
      .select("versionNumber mode title targetRole careerGoal careerScore jobReadiness generatedAt createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      snapshots
    });
  } catch (err) {
    console.error("Error in getSnapshots controller:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch report snapshots"
    });
  }
}

/**
 * POST /api/career/report/snapshot
 * Creates a new historical snapshot version.
 */
async function createSnapshot(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const mode = req.body.mode === "private" ? "private" : "shareable";
    const title = req.body.title || "";

    const { snapshot, reportDTO } = await createCareerReportSnapshot(userId, mode, title);

    return res.status(201).json({
      success: true,
      message: `Career Report v${snapshot.versionNumber} snapshot created successfully.`,
      snapshot
    });
  } catch (err) {
    console.error("Error in createSnapshot controller:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create report snapshot"
    });
  }
}

module.exports = {
  getCareerReport,
  downloadReportPdf,
  getReportSummary,
  getSnapshots,
  createSnapshot
};
