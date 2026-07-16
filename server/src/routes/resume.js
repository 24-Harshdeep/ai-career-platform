const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const resumeService = require("../services/resume.service");

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

// 1. Fetch Resume Analysis
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

const multer = require("multer");
const pdfParse = require("pdf-parse");
const cloudinary = require("../config/cloudinary");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// 2. Upload and Scan Resume
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  let targetFilename = "resume.pdf";
  let targetText = "";
  let cloudinaryUrl = "";

  if (req.file) {
    targetFilename = req.file.originalname;

    try {
      // 1. Extract text from PDF
      if (req.file.mimetype === "application/pdf") {
        const pdfData = await pdfParse(req.file.buffer);
        targetText = pdfData.text;
      } else {
        // Fallback for plain text files
        targetText = req.file.buffer.toString("utf-8");
      }

      // 2. Upload raw file buffer to Cloudinary if configured
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
          console.warn("[Resume Upload] Cloudinary upload failed (proceeding with parsing only):", cloudinaryErr.message);
        }
      }
    } catch (err) {
      console.error("[Resume Upload] File parsing failed:", err);
      return errorResponse(res, `File parsing failed: ${err.message}`, [], 500);
    }
  } else {
    // Fallback to body properties (compatibility mode)
    const { filename, parsedText } = req.body;
    targetFilename = filename || "resume.pdf";
    targetText = parsedText;
  }

  if (!targetText || !targetText.trim()) {
    return errorResponse(res, "Could not extract text content from the uploaded resume. Please upload a valid PDF or text document.");
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

module.exports = router;
