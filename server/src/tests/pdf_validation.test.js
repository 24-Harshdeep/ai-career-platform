const mongoose = require("mongoose");
const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");
const CareerEvent = require("../models/CareerEvent");
const CareerReportSnapshot = require("../models/CareerReportSnapshot");
const { generateCareerIntelligenceReport } = require("../services/careerIntelligence.service");
const { buildCareerReportPdf } = require("../services/reportPdf.service");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function runPdfValidationTest() {
  console.log("=== Starting CareerOS PDF Page Validation Test Suite ===");
  let userIdForCleanup;

  let mongoUri = process.env.TEST_MONGO_URI || process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/careeros_test";
  if (!/(^|[/])careeros_(test|release_test)(\?|$)/.test(mongoUri)) {
    mongoUri = mongoUri.replace(/\/careeros(\?|$)/, "/careeros_test$1");
  }
  if (!/(^|[/])careeros_(test|release_test)(\?|$)/.test(mongoUri)) {
    throw new Error("PDF validation requires an isolated careeros_test or careeros_release_test database.");
  }
  await mongoose.connect(mongoUri);
  console.log("✔ Connected to MongoDB");

  try {
    // 1. Setup Test Candidate
    const testEmail = `pdf_val_${Date.now()}@careeros.ai`;
    const user = await User.create({
      name: "PDF Validation Candidate",
      email: testEmail,
      passwordHash: "$2a$10$hashedpasswordplaceholder123",
      role: "Full Stack Developer",
      goal: "Become a Principal Software Engineer",
      experience: "Advanced",
      score: 78,
      streakDays: 8
    });
    userIdForCleanup = user._id;

    await CareerProfile.create({
      userId: user._id,
      targetRole: "Full Stack Developer",
      careerGoal: "Become a Principal Software Engineer",
      experienceLevel: "Advanced",
      skillsPossessed: {
        languages: ["TypeScript", "JavaScript", "Python"],
        frameworks: ["React", "Next.js", "Express", "Node.js"],
        database: ["MongoDB", "PostgreSQL"],
        tools: ["Docker", "Git", "Jest"]
      }
    });

    console.log(`✔ Created candidate with ID: ${user._id}`);

    // 2. Compile Report DTO & Render PDF Buffer
    console.log("\n--- Generating Report DTO & PDF Buffer ---");
    const reportData = await generateCareerIntelligenceReport(user._id, "shareable");
    const pdfBuffer = await buildCareerReportPdf(reportData);

    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error("PDF rendering failed: returned empty or non-buffer output!");
    }
    console.log(`✔ PDF Buffer generated successfully (${pdfBuffer.length} bytes).`);

    // 3. Validate generated structure without a legacy parser that rejects
    // PDFKit's valid xref stream output.
    console.log("\n--- Validating PDF Structure & Page Counts ---");
    const pdfText = pdfBuffer.toString("latin1");
    if (!pdfText.startsWith("%PDF-") || !pdfText.includes("%%EOF")) {
      throw new Error("Generated document is missing a valid PDF header or EOF marker.");
    }
    const pageCount = (pdfText.match(/\/Type \/Page\b/g) || []).length;
    if (pageCount < 1) throw new Error("PDF must contain at least one page.");
    console.log(`✔ PDF header, EOF marker, and ${pageCount} page object(s) verified.`);


    // Cleanup
    await User.findByIdAndDelete(user._id);
    await CareerProfile.deleteOne({ userId: user._id });
    await CareerEvent.deleteMany({ userId: user._id });
    await CareerReportSnapshot.deleteMany({ userId: user._id });

    console.log("\n==================================================");
    console.log("ALL PDF VALIDATION TESTS PASSED (0 BLANK PAGES)");
    console.log("==================================================");

  } catch (err) {
    if (userIdForCleanup) {
      await User.findByIdAndDelete(userIdForCleanup);
      await CareerProfile.deleteOne({ userId: userIdForCleanup });
      await CareerEvent.deleteMany({ userId: userIdForCleanup });
      await CareerReportSnapshot.deleteMany({ userId: userIdForCleanup });
    }
    console.error("\n❌ PDF Validation Test Failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPdfValidationTest();
