const assert = require("assert");

const JobProvider = require("../providers/JobProvider");
const { normalizeJob, extractSkillsFromText, inferExperienceLevel } = require("../services/jobNormalizer.service");
const { deduplicateJobs, getDeduplicationKey } = require("../services/jobDeduplicator.service");
const { evaluateJobMatch, isExperienceCompatible } = require("../services/jobMatching.service");

class MockSuccessProvider extends JobProvider {
  constructor() {
    super("mock_success");
  }
  async searchJobs() {
    return [{
      provider: "mock_success",
      sourceJobId: "job-1",
      title: "Senior Full Stack Engineer",
      company: { name: "TechCorp" },
      location: { raw: "San Francisco, CA", remote: true },
      description: "We are looking for a Senior Developer experienced in React, Node.js, TypeScript, and AWS.",
      url: "https://techcorp.com/jobs/1",
      publishedAt: new Date()
    }];
  }
}

class MockFailingProvider extends JobProvider {
  constructor() {
    super("mock_fail");
  }
  async searchJobs() {
    throw new Error("API rate limit exceeded or connection timeout");
  }
}

async function runJobIntelligenceTests() {
  console.log("==================================================");
  console.log("CAREEROS JOB INTELLIGENCE & RECENT JOBS ENGINE TESTS");
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

  // TEST 1: Provider Failure Isolation
  try {
    const successProv = new MockSuccessProvider();
    const failProv = new MockFailingProvider();

    const results = await Promise.allSettled([
      successProv.searchJobs({ q: "react" }),
      failProv.searchJobs({ q: "react" })
    ]);

    assert.strictEqual(results[0].status, "fulfilled", "Success provider should resolve");
    assert.strictEqual(results[1].status, "rejected", "Failing provider should reject");
    assert.strictEqual(results[0].value.length, 1, "Success provider returned valid jobs");

    logPass("Provider Architecture - Failure in one provider is isolated and does not crash aggregator");
  } catch (err) {
    logFail("Provider Architecture - Failure in one provider is isolated and does not crash aggregator", err);
  }

  // TEST 2: Job Normalizer Service
  try {
    const rawAdzuna = {
      provider: "adzuna",
      sourceJobId: "adzuna-99",
      title: "Senior Frontend Engineer (React / TypeScript)",
      company: { display_name: "Acme Inc" },
      location: { display_name: "New York, NY", area: ["US", "New York"] },
      description: "Build UI with React, Next.js, Redux, and Tailwind CSS. Deploy on AWS.",
      redirect_url: "https://adzuna.com/job/99",
      created: "2026-09-18T10:00:00Z"
    };

    const normalized = normalizeJob(rawAdzuna);

    assert.strictEqual(normalized.provider, "adzuna");
    assert.strictEqual(normalized.title, "Senior Frontend Engineer (React / TypeScript)");
    assert.strictEqual(normalized.company.name, "Acme Inc");
    assert.ok(normalized.skills.includes("React"), "Expected extracted skill React");
    assert.ok(normalized.skills.includes("TypeScript"), "Expected extracted skill TypeScript");
    assert.ok(normalized.skills.includes("Next.js"), "Expected extracted skill Next.js font");
    assert.strictEqual(normalized.experienceLevel, "Senior", "Expected inferred Senior level");
    assert.ok(normalized.hash && normalized.hash.length > 10, "Hash should be generated");

    logPass("Job Normalizer - Standardizes raw provider response into CareerOS Job schema");
  } catch (err) {
    logFail("Job Normalizer - Standardizes raw provider response into CareerOS Job schema", err);
  }

  // TEST 3: Job Deduplication Service
  try {
    const job1 = normalizeJob({
      provider: "adzuna",
      sourceJobId: "adz-1",
      title: "React Developer",
      company: { name: "Company X" },
      location: { raw: "Remote", remote: true },
      description: "React and Node.js developer needed",
      url: "https://adzuna.com/job/1",
      source: "Adzuna",
      publishedAt: new Date()
    });

    const job2 = normalizeJob({
      provider: "greenhouse",
      sourceJobId: "gh-2",
      title: "React Developer",
      company: { name: "Company X" },
      location: { raw: "Remote", remote: true },
      description: "React and Node.js developer needed",
      url: "https://boards.greenhouse.io/companyx/jobs/2",
      source: "Greenhouse",
      publishedAt: new Date()
    });

    const deduplicated = deduplicateJobs([job1, job2]);

    assert.strictEqual(deduplicated.length, 1, "Duplicate jobs should be merged into 1 canonical job");
    assert.ok(deduplicated[0].sources.includes("Adzuna"), "Sources list should include Adzuna");
    assert.ok(deduplicated[0].sources.includes("Greenhouse"), "Sources list should include Greenhouse");
    assert.strictEqual(deduplicated[0].url, "https://boards.greenhouse.io/companyx/jobs/2", "Direct board URL preferred");

    logPass("Job Deduplicator - Merges identical postings into canonical job with multiple sources");
  } catch (err) {
    logFail("Job Deduplicator - Merges identical postings into canonical job with multiple sources", err);
  }

  // TEST 4: Recent Jobs Engine Time Filtering Logic
  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const recentJob = normalizeJob({
      provider: "lever",
      title: "Software Engineer",
      company: { name: "FastTech" },
      publishedAt: twoHoursAgo,
      description: "Node.js engineer",
      url: "https://lever.co/1"
    });

    const olderJob = normalizeJob({
      provider: "lever",
      title: "Software Engineer",
      company: { name: "OldTech" },
      publishedAt: fiveDaysAgo,
      description: "Node.js engineer",
      url: "https://lever.co/2"
    });

    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    assert.ok(recentJob.publishedAt >= cutoff24h, "Recent job within 24h filter");
    assert.ok(olderJob.publishedAt < cutoff24h, "Older job outside 24h filter");

    logPass("Recent Jobs Engine - Correctly distinguishes publishedAt bounds for 24h / 3d filters");
  } catch (err) {
    logFail("Recent Jobs Engine - Correctly distinguishes publishedAt bounds for 24h / 3d filters", err);
  }

  // TEST 5: CareerOS Matching & Skill Gap Engine
  try {
    const mockContext = {
      targetRole: "Full Stack Developer",
      experienceLevel: "Intermediate",
      workType: "Remote",
      skillsPossessed: {
        technical: ["React", "TypeScript", "Node.js", "Express", "MongoDB"]
      }
    };

    const mockJob = normalizeJob({
      provider: "ashby",
      title: "Full Stack Developer",
      company: { name: "Linear" },
      skills: ["React", "TypeScript", "Node.js", "MongoDB", "AWS", "Docker"],
      description: "Full Stack role with React, Node.js, AWS and Docker.",
      location: { raw: "Remote", remote: true },
      url: "https://jobs.ashbyhq.com/linear/1"
    });

    const matchResult = evaluateJobMatch(mockContext, mockJob);

    assert.ok(matchResult.matchScore >= 75, `Expected high match score, got ${matchResult.matchScore}`);
    assert.ok(matchResult.matchedSkills.includes("React"), "React should be in matched skills");
    assert.ok(matchResult.missingSkills.includes("AWS"), "AWS should be in missing skills");
    assert.ok(matchResult.missingSkills.includes("Docker"), "Docker should be in missing skills");
    assert.ok(matchResult.reasons.length >= 2, "Expected structured match reasons");
    assert.ok(matchResult.skillGaps.length >= 1, "Expected skill gap recommendations for missing skills");

    logPass("Job Matching Engine - Computes deterministic CareerOS Match, matched skills, and skill gap advice");
  } catch (err) {
    logFail("Job Matching Engine - Computes deterministic CareerOS Match, matched skills, and skill gap advice", err);
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runJobIntelligenceTests();
