const assert = require("assert");
const { calculateReadiness } = require("../engines/readiness.engine");
const { calculateCareerScore } = require("../engines/careerScore.engine");
const { computeNextBestAction } = require("../engines/nextBestAction.engine");

async function runDataSyncTests() {
  console.log("==================================================");
  console.log("CAREEROS DATA SYNC & INTERVIEW INTEGRATION TESTS");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function logPass(testName) {
    console.log(`[PASS] ${testName}`);
    passed++;
  }

  function logFail(testName, err) {
    console.error(`[FAIL] ${testName}:`, err.message);
    failed++;
  }

  // TEST 1: Readiness Engine - Real Interview Score Boost
  try {
    const baseInput = {
      careerScore: 60,
      hasResumeScanned: true,
      hasGithubScanned: true,
      projectsCount: 2,
      masteredQuestionsCount: 1,
      resumeScore: 70,
      interviewScore: null
    };

    const readinessWithoutInterview = calculateReadiness(baseInput);
    const readinessWithInterview = calculateReadiness({ ...baseInput, interviewScore: 85 });

    assert.ok(
      readinessWithInterview.jobReadiness > readinessWithoutInterview.jobReadiness,
      `Expected job readiness to increase with 85% interview score (Was ${readinessWithoutInterview.jobReadiness}, now ${readinessWithInterview.jobReadiness})`
    );
    assert.strictEqual(readinessWithInterview.interviewReadiness, 85, "Expected interviewReadiness to equal 85");
    logPass("Readiness Engine - Interview scores directly increase overall Job Readiness");
  } catch (err) {
    logFail("Readiness Engine - Interview scores directly increase overall Job Readiness", err);
  }

  // TEST 2: Career Score Engine - Skills & Activity Weighting
  try {
    const scoreResult = calculateCareerScore({
      hasResumeScanned: true,
      hasGithubScanned: true,
      projectsCount: 3,
      skillsCount: 7,
      roadmapAverageProgress: 50,
      applicationsCount: 2,
      masteredQuestionsCount: 3,
      streakDays: 5
    });

    assert.ok(scoreResult.score > 50, "Career score should be above 50 for active candidate");
    assert.ok(scoreResult.breakdown.interview > 0, "Interview score breakdown should be positive");
    logPass("Career Score Engine - Incorporates skills and interview milestones into score breakdown");
  } catch (err) {
    logFail("Career Score Engine - Incorporates skills and interview milestones into score breakdown", err);
  }

  // TEST 3: Next Best Action Engine - Interview Weakness Action Recommendation
  try {
    const context = {
      targetRole: "Full Stack Developer",
      resumeContext: { atsScore: 80, missingKeywords: [] },
      devContext: { overallHealth: 85, missingPractices: [] },
      interviewContext: {
        completedCount: 3,
        averageScore: 45,
        repeatingMistakes: [
          { concept: "JWT Authentication", frequency: 3, severity: "High" },
          { concept: "React Hydration", frequency: 2, severity: "High" }
        ]
      }
    };

    const actions = await computeNextBestAction(context);
    assert.ok(Array.isArray(actions) && actions.length > 0, "Expected array of actions");
    const hasInterviewAction = actions.some(a => a.type === "Interview" || a.title.includes("JWT Authentication"));
    assert.ok(hasInterviewAction, "Expected Next Best Action to recommend practicing JWT Authentication");
    logPass("Next Best Action Engine - Recommends targeted action for repeating interview weakness");
  } catch (err) {
    logFail("Next Best Action Engine - Recommends targeted action for repeating interview weakness", err);
  }

  // TEST 4: Next Best Action Engine - First Interview Recommendation
  try {
    const context = {
      targetRole: "Full Stack Developer",
      resumeContext: { atsScore: 80, missingKeywords: [] },
      devContext: { overallHealth: 85, missingPractices: [] },
      interviewContext: { completedCount: 0, repeatingMistakes: [] }
    };

    const actions = await computeNextBestAction(context);
    const firstInterviewAction = actions.find(a => a.actionId === "action-interview-first");
    assert.ok(firstInterviewAction, "Expected action-interview-first recommendation for new candidate");
    assert.ok(firstInterviewAction.description.includes("Full Stack Developer"), "Expected target role in action description");
    logPass("Next Best Action Engine - Recommends initial mock interview for target role when 0 interviews completed");
  } catch (err) {
    logFail("Next Best Action Engine - Recommends initial mock interview for target role when 0 interviews completed", err);
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  process.exit(failed > 0 ? 1 : 0);
}

runDataSyncTests();
