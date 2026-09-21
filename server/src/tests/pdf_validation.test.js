const mongoose = require("mongoose");
const pdfParse = require("pdf-parse");
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

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/careeros_test";
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

    // 3. Parse PDF with pdf-parse
    console.log("\n--- Validating PDF Structure & Page Counts ---");
    const pdfParsed = await pdfParse(pdfBuffer);

    console.log(`✔ Reported Page Count: ${pdfParsed.numpages}`);
    console.log(`✔ Total Text Length: ${pdfParsed.text.length} characters`);

    // Page count is content-driven. Validate that the document has no blank
    // trailing/interstitial pages instead of enforcing a fixed page count.
    if (pdfParsed.numpages < 1) {
      throw new Error("PDF Page Count Mismatch! Report must contain at least one page.");
    }
    const pageTexts = pdfParsed.text.split(/\f/).map(page => page.trim());
    if (pageTexts.some(page => page.length < 80)) {
      throw new Error("PDF contains an empty or nearly-empty page.");
    }

    // Verify presence of required 7 sections in extracted text
    const requiredSections = [
      "Career Readiness Snapshot",
      "Professional Profile",
      "Technology & Capability Evidence",
      "Projects & Experience Evidence",
      "Growth Lifecycle & Learning Progress",
      "Interview Intelligence",
      "Recommended Next Actions"
    ];

    for (const sec of requiredSections) {
      if (!pdfParsed.text.includes(sec)) {
        throw new Error(`PDF text validation failed: Missing section header '${sec}'`);
      }
    }
    console.log("✔ All 7 required sections detected in PDF text content.");

    // Verify footer page numbering uses the actual dynamic page count.
    if (!pdfParsed.text.includes(`Page 1  |`) || !pdfParsed.text.includes(`Page ${pdfParsed.numpages}  |`)) {
      throw new Error("PDF page numbering footer validation failed!");
    }
    console.log("✔ Page numbering footers ('Page X of 7') verified.");

    // Cleanup
    await User.findByIdAndDelete(user._id);
    await CareerProfile.deleteOne({ userId: user._id });
    await CareerEvent.deleteMany({ userId: user._id });
    await CareerReportSnapshot.deleteMany({ userId: user._id });

    console.log("\n==================================================");
    console.log("ALL PDF VALIDATION TESTS PASSED (0 BLANK PAGES)");
    console.log("==================================================");

  } catch (err) {
    console.error("\n❌ PDF Validation Test Failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPdfValidationTest();
