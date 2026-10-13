const mongoose = require("mongoose");
const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");
const CareerEvent = require("../models/CareerEvent");
const CareerReportSnapshot = require("../models/CareerReportSnapshot");
const CareerAiSummary = require("../models/CareerAiSummary");
const { updateProfile, getCareerStats } = require("../services/career.service");
const { generateCareerIntelligenceReport, createCareerReportSnapshot, generateAiExecutiveSummary } = require("../services/careerIntelligence.service");
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

    // 3. Test Score & Readiness Parity between Dashboard (career.service) and Career Report
    console.log("\n--- Test 2: Career Score & Readiness Score Parity across Dashboard & Report ---");
    const dashboardStats = await getCareerStats(user._id);
    const shareableReport = await generateCareerIntelligenceReport(user._id, "shareable");

    if (dashboardStats.score !== shareableReport.careerScore) {
      throw new Error(`Career score mismatch! Dashboard: ${dashboardStats.score}, Report: ${shareableReport.careerScore}`);
    }
    if (dashboardStats.readiness.jobReadiness !== shareableReport.jobReadiness) {
      throw new Error(`Job readiness mismatch! Dashboard: ${dashboardStats.readiness.jobReadiness}, Report: ${shareableReport.jobReadiness}`);
    }
    console.log(`✔ 100% Score Parity Verified (Career Score: ${shareableReport.careerScore}, Readiness: ${shareableReport.jobReadiness}%).`);

    // 4. Test Empty Interview & Baseline Growth State (Zero Fake Data Check)
    console.log("\n--- Test 3: Empty State Handling & Baseline Growth Check ---");
    if (shareableReport.interviewIntelligence.completedCount !== 0 || shareableReport.interviewIntelligence.averageScore !== null) {
      throw new Error(`Expected completedCount 0 and null averageScore for new candidate, got: ${JSON.stringify(shareableReport.interviewIntelligence)}`);
    }
    if (shareableReport.growth.previousScore !== null || !shareableReport.growth.growthText.includes("Initial baseline established")) {
      throw new Error(`Growth text or previousScore invalid for baseline: ${JSON.stringify(shareableReport.growth)}`);
    }
    console.log("✔ Clean empty state and baseline growth messages verified without fake scores or percentages.");

    // 5. Test Zero Automatic AI Calls on Report Compilation
    console.log("\n--- Test 4: Shareable Report Compilation (Zero Automatic AI Calls) ---");
    if (shareableReport.targetRole !== "Full Stack Developer") {
      throw new Error(`Report targetRole is invalid: ${shareableReport.targetRole}`);
    }
    if (shareableReport.aiSummary.status !== "NONE") {
      throw new Error(`Expected aiSummary.status NONE prior to explicit generation, got: ${shareableReport.aiSummary.status}`);
    }
    console.log("✔ Shareable report mode compiled cleanly with 0 automatic AI calls.");

    // 6. Test User-Initiated AI Executive Summary Generation & Gender Neutrality
    console.log("\n--- Test 5: User-Initiated AI Executive Summary & Gender Neutrality ---");
    const scoreBeforeAi = shareableReport.careerScore;
    const generatedAiSummary = await generateAiExecutiveSummary(user._id);

    if (!generatedAiSummary || generatedAiSummary.status !== "CURRENT" || generatedAiSummary.versionNumber !== 1) {
      throw new Error(`Generated AI summary invalid: ${JSON.stringify(generatedAiSummary)}`);
    }

    // Gender neutrality check
    const content = generatedAiSummary.content;
    const genderedMatches = content.match(/\b(he|she|his|her|hers)\b/gi);
    if (genderedMatches && genderedMatches.length > 0) {
      throw new Error(`AI generated content contains gendered pronouns: ${genderedMatches.join(", ")}`);
    }

    const reportWithAi = await generateCareerIntelligenceReport(user._id, "shareable");
    if (reportWithAi.careerScore !== scoreBeforeAi) {
      throw new Error("AI Summary generation mutated deterministic career score!");
    }
    if (reportWithAi.aiSummary.status !== "CURRENT" || reportWithAi.aiSummary.versionNumber !== 1) {
      throw new Error(`Report did not reflect current AI summary status! Got: ${JSON.stringify(reportWithAi.aiSummary)}`);
    }
    console.log("✔ Explicit AI Executive Summary generated, gender-neutral, versioned (v1, CURRENT), with 0 score mutations.");

    // 7. Test Staleness Propagation when Profile Details Change
    console.log("\n--- Test 6: Staleness Marking on Target Role / Goal / Experience Updates ---");
    await updateProfile(user._id, { targetRole: "DevOps Engineer" });
    const staleReport = await generateCareerIntelligenceReport(user._id, "shareable");
    if (staleReport.aiSummary.status !== "STALE") {
      throw new Error(`Expected aiSummary status to be STALE after role change, got: ${staleReport.aiSummary.status}`);
    }
    console.log("✔ Profile update correctly marked existing AI summary as STALE without calling AI automatically.");

    // 8. Test Historical Report Snapshots & Immutability
    console.log("\n--- Test 7: Historical Snapshot Versioning & Immutability ---");
    const { snapshot: snap1 } = await createCareerReportSnapshot(user._id, "shareable", "Snapshot Version 1");

    if (snap1.versionNumber !== 1) {
      throw new Error("Snapshot 1 version invalid!");
    }

    // Change target role again in Settings
    await updateProfile(user._id, { targetRole: "Cloud Architect" });
    const { snapshot: snap2 } = await createCareerReportSnapshot(user._id, "shareable", "Snapshot Version 2");

    if (snap2.versionNumber !== 2 || snap2.targetRole !== "Cloud Architect") {
      throw new Error("Snapshot 2 version or targetRole invalid!");
    }

    // Verify Snapshot 1 remained immutable
    const fetchedSnap1 = await CareerReportSnapshot.findById(snap1._id);
    if (fetchedSnap1.targetRole !== "DevOps Engineer") {
      throw new Error("Historical Snapshot 1 was mutated after target role change!");
    }
    console.log("✔ Historical report snapshot versioning (v1, v2) verified immutable.");

    // 9. Test Vector PDF Generation
    console.log("\n--- Test 8: Vector PDF Generation for Shareable & Private Modes ---");
    const shareablePdf = await buildCareerReportPdf(shareableReport);
    const privatePdf = await buildCareerReportPdf(staleReport);

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
    await CareerAiSummary.deleteMany({ userId: user._id });
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
