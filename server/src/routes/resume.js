const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const resumeService = require("../services/resume.service");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cloudinary = require("../config/cloudinary");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Helper: Standardize Success JSON Envelope
const successResponse = (res, message, data) => {
  return res.json({
    success: true,
    message,
    data
  });
};

// Helper: Standardize Error JSON Envelope
const errorResponse = (res, message, errors = [], status = 400) => {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
};

// 1. Fetch Resume Analysis (Details, Versions, Score)
router.get("/analysis", authMiddleware, async (req, res) => {
  try {
    const data = await resumeService.getResumeAnalysis(req.user._id || req.user.id);
    if (!data) {
      return successResponse(res, "No resume uploaded yet.", null);
    }
    return successResponse(res, "Resume analysis retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve analysis: ${err.message}`, [], 500);
  }
});

// 2. Upload and Scan Resume
router.post("/upload", authMiddleware, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const message = err.code === "LIMIT_FILE_SIZE"
        ? "Resume file is too large. Maximum size is 5MB."
        : `Resume upload failed: ${err.message}`;
      return errorResponse(res, message, [], 400);
    }
    next();
  });
}, async (req, res) => {
  let targetFilename = "resume.pdf";
  let targetText = "";
  let cloudinaryUrl = "";

  if (req.file) {
    targetFilename = req.file.originalname;

    try {
      if (req.file.mimetype === "application/pdf") {
        const pdfData = await pdfParse(req.file.buffer);
        targetText = pdfData.text;
      } else {
        targetText = req.file.buffer.toString("utf-8");
      }

      if (process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: "raw",
                folder: "resumes",
                public_id: `${req.user._id || req.user.id}_${Date.now()}_${targetFilename}`
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(req.file.buffer);
          });
          cloudinaryUrl = uploadResult.secure_url;
        } catch (cloudinaryErr) {
          console.warn("[Resume Upload] Cloudinary upload failed:", cloudinaryErr.message);
        }
      }
    } catch (err) {
      console.error("[Resume Upload] File parsing failed:", err);
      return errorResponse(res, `File parsing failed: ${err.message}`, [], 500);
    }
  } else {
    const { filename, parsedText } = req.body;
    targetFilename = filename || "resume.pdf";
    targetText = parsedText;
  }

  if (!targetText || !targetText.trim()) {
    return errorResponse(res, "Could not extract text content from the uploaded resume.");
  }

  try {
    const data = await resumeService.uploadAndAnalyzeResume(
      req.user._id || req.user.id,
      targetFilename,
      targetText,
      cloudinaryUrl || null
    );
    return successResponse(res, "Resume analyzed successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to analyze resume: ${err.message}`, [], 500);
  }
});

// 3. Save Resume Form Edits
router.put("/content", authMiddleware, async (req, res) => {
  try {
    const data = await resumeService.saveResumeEdits(req.user._id || req.user.id, req.body);
    return successResponse(res, "Resume edits saved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to save edits: ${err.message}`, [], 500);
  }
});

// 4. Fork Resume Version
router.post("/versions/fork", authMiddleware, async (req, res) => {
  try {
    const { title, goal } = req.body;
    const data = await resumeService.forkResumeVersion(req.user._id || req.user.id, title, goal);
    return successResponse(res, "Resume version forked successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to fork version: ${err.message}`, [], 500);
  }
});

// 5. Restore Resume Version
router.post("/versions/restore", authMiddleware, async (req, res) => {
  try {
    const { versionNumber } = req.body;
    const data = await resumeService.restoreResumeVersion(req.user._id || req.user.id, versionNumber);
    return successResponse(res, "Resume version restored successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to restore version: ${err.message}`, [], 500);
  }
});

// 6. Fetch Cross-Module Recommendations
router.get("/cross-sync", authMiddleware, async (req, res) => {
  try {
    const data = await resumeService.getCrossSyncSuggestions(req.user._id || req.user.id);
    return successResponse(res, "Cross-sync recommendations retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve suggestions: ${err.message}`, [], 500);
  }
});

// 7. Full AI Resume Optimization
router.post("/optimize", authMiddleware, async (req, res) => {
  try {
    const { goal, targetDescription } = req.body;
    const data = await resumeService.optimizeResumeContent(req.user._id || req.user.id, goal, targetDescription);
    return successResponse(res, "Resume optimized successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to optimize resume: ${err.message}`, [], 500);
  }
});
// 8. Review Pending Change Log
router.post("/changelog/review", authMiddleware, async (req, res) => {
  try {
    const { logId, status, editedText } = req.body;
    const data = await resumeService.reviewChangeLog(req.user._id || req.user.id, logId, status, editedText);
    return successResponse(res, "Change log updated.", data);
  } catch (err) {
    return errorResponse(res, `Failed to update change log: ${err.message}`, [], 500);
  }
});

// 9. Apply Pending Change Logs
router.post("/changelog/apply", authMiddleware, async (req, res) => {
  try {
    const { goal } = req.body;
    const data = await resumeService.applyChangeLogs(req.user._id || req.user.id, goal);
    return successResponse(res, "Change logs applied successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to apply change logs: ${err.message}`, [], 500);
  }
});
module.exports = router;
