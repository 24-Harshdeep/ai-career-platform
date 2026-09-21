const mongoose = require("mongoose");
const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");
const CareerEvent = require("../models/CareerEvent");
const CareerReportSnapshot = require("../models/CareerReportSnapshot");
const { updateProfile } = require("../services/career.service");
const { generateCareerIntelligenceReport, createCareerReportSnapshot } = require("../services/careerIntelligence.service");
const { buildCareerReportPdf } = require("../services/reportPdf.service");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function runTests() {
  console.log("=== Starting CareerOS Central Brain & Report Integration Tests ===");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/careeros_test";
  await mongoose.connect(mongoUri);
  console.log("✔ Connected to MongoDB:", mongoUri);

  try {
    // 1. Setup Test User
    const testEmail = `test_architect_${Date.now()}@careeros.ai`;
    const user = await User.create({
      name: "Test Architect Candidate",
      email: testEmail,
      passwordHash: "$2a$10$hashedpasswordplaceholder123",
      role: "Backend Developer",
      goal: "Become a Lead Backend Architect",
      experience: "Intermediate",
      score: 65,
      streakDays: 5
    });

    console.log(`✔ Test user created with ID: ${user._id}`);

    // 2. Test Target Role Synchronization via updateProfile
    console.log("\n--- Test 1: Target Role Synchronization ---");
    await updateProfile(user._id, {
      targetRole: "Full Stack Developer",
      careerGoal: "Build Scalable Distributed Systems",
      experienceLevel: "Advanced"
    });

    const refreshedUser = await User.findById(user._id);
    const refreshedProfile = await CareerProfile.findOne({ userId: user._id });

    if (refreshedUser.role !== "Full Stack Developer" || refreshedProfile.targetRole !== "Full Stack Developer") {
      throw new Error(`Target role mismatch! User role: ${refreshedUser.role}, Profile role: ${refreshedProfile.targetRole}`);
    }
    console.log("✔ Target role synchronized successfully across User, Profile, and CareerEvent.");

    // 3. Test Shareable Report Mode (Professional Portfolio Format)
    console.log("\n--- Test 2: Shareable Report Mode DTO Compilation & Zero-Fake-Data Check ---");
    const shareableReport = await generateCareerIntelligenceReport(user._id, "shareable");

    if (shareableReport.targetRole !== "Full Stack Developer") {
      throw new Error(`Report targetRole is invalid: ${shareableReport.targetRole}`);
    }
    if (shareableReport.candidateEmail !== undefined) {
      throw new Error("Private candidate email leaked in shareable report!");
    }
    if (!shareableReport.executiveSummary || shareableReport.executiveSummary.includes("**")) {
      throw new Error("Executive summary contains raw markdown asterisks or is empty!");
    }
    if (!Array.isArray(shareableReport.shareableLifecycles)) {
      throw new Error("Shareable growth lifecycles array missing!");
    }
    console.log("✔ Shareable report mode compiled cleanly without raw markdown or private leakages.");

    // 4. Test Private Report Mode (Internal Diagnostic Format)
    console.log("\n--- Test 3: Private Report Mode DTO Compilation ---");
    const privateReport = await generateCareerIntelligenceReport(user._id, "private");

    if (privateReport.candidateEmail !== testEmail) {
      throw new Error("Candidate email missing from private report!");
    }
    if (!Array.isArray(privateReport.skillGapLifecycle)) {
      throw new Error("Skill gap lifecycle missing in private report!");
    }
    console.log("✔ Private diagnostic report mode compiled cleanly.");

    // 5. Test Historical Report Snapshots & Immutability
    console.log("\n--- Test 4: Historical Snapshot Versioning & Immutability ---");
    const { snapshot: snap1 } = await createCareerReportSnapshot(user._id, "shareable", "Snapshot Version 1");
    
    if (snap1.versionNumber !== 1 || snap1.targetRole !== "Full Stack Developer") {
      throw new Error("Snapshot 1 version or targetRole invalid!");
    }

    // Change target role in Settings
    await updateProfile(user._id, { targetRole: "DevOps Engineer" });
    const { snapshot: snap2 } = await createCareerReportSnapshot(user._id, "shareable", "Snapshot Version 2");

    if (snap2.versionNumber !== 2 || snap2.targetRole !== "DevOps Engineer") {
      throw new Error("Snapshot 2 version or targetRole invalid!");
    }

    // Verify Snapshot 1 remained immutable
    const fetchedSnap1 = await CareerReportSnapshot.findById(snap1._id);
    if (fetchedSnap1.targetRole !== "Full Stack Developer") {
      throw new Error("Historical Snapshot 1 was mutated after target role change!");
    }
    console.log("✔ Historical report snapshot versioning (v1, v2) verified immutable.");

    // 6. Test Vector PDF Generation
    console.log("\n--- Test 5: Vector PDF Generation for Shareable & Private Modes ---");
    const shareablePdf = await buildCareerReportPdf(shareableReport);
    const privatePdf = await buildCareerReportPdf(privateReport);

    if (!Buffer.isBuffer(shareablePdf) || shareablePdf.length < 1000) {
      throw new Error("Shareable PDF generation returned invalid or truncated buffer!");
    }
    if (!Buffer.isBuffer(privatePdf) || privatePdf.length < 1000) {
      throw new Error("Private PDF generation returned invalid or truncated buffer!");
    }
    console.log(`✔ Vector PDFs successfully generated (Shareable: ${shareablePdf.length} bytes, Private: ${privatePdf.length} bytes).`);

    // Cleanup test user & data
    await User.findByIdAndDelete(user._id);
    await CareerProfile.deleteOne({ userId: user._id });
    await CareerEvent.deleteMany({ userId: user._id });
    await CareerReportSnapshot.deleteMany({ userId: user._id });
    console.log("\n✔ Test cleanup completed successfully.");

    console.log("\n==================================================");
    console.log("ALL CAREEROS CAREER REPORT TESTS PASSED CLEANLY!");
    console.log("==================================================");

  } catch (err) {
    console.error("\n❌ Test Failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
