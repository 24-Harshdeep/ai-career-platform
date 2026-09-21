const assert = require("assert");
const { normalizeIndiaLocation } = require("../services/indiaLocationNormalizer");
const { normalizeRoleFamily, normalizeSeniority } = require("../services/roleNormalizer.service");
const { normalizeJob } = require("../services/jobNormalizer.service");
const { deduplicateJobs, getDeduplicationKey } = require("../services/jobDeduplicator.service");
const { evaluateJobMatch } = require("../services/jobMatching.service");
const { getProvidersHealth, getEnabledProviders } = require("../providers");

async function runMultiSourceJobIntelligenceTests() {
  console.log("==================================================");
  console.log("CAREEROS MULTI-SOURCE INDIA-AWARE JOB ENGINE TESTS");
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

  // TEST 1: Provider Registry & Health Tracking
  try {
    const healthMap = await getProvidersHealth();
    assert.ok(healthMap.jobvetta, "Jobvetta health must be present");
    assert.ok(healthMap.indianapi, "IndianAPI health must be present");
    assert.ok(healthMap.jooble, "Jooble health must be present");
    assert.ok(healthMap.adzuna, "Adzuna health must be present");

    const enabled = getEnabledProviders();
    assert.ok(enabled.length >= 4, "At least 4 core providers registered");

    logPass("Provider Registry - Live provider health check & registration");
  } catch (err) {
    logFail("Provider Registry - Live provider health check & registration", err);
  }

  // TEST 2: Indian Location Normalization
  try {
    const loc1 = normalizeIndiaLocation("Bangalore, KA");
    assert.strictEqual(loc1.city, "Bengaluru");
    assert.strictEqual(loc1.state, "Karnataka");
    assert.strictEqual(loc1.country, "India");

    const loc2 = normalizeIndiaLocation("Gurgaon");
    assert.strictEqual(loc2.city, "Gurugram");
    assert.strictEqual(loc2.state, "Haryana");

    const loc3 = normalizeIndiaLocation({ raw: "Mumbai (Work From Home)", remote: true });
    assert.strictEqual(loc3.remoteType, "Remote");
    assert.strictEqual(loc3.city, "Mumbai");

    logPass("India Location Normalizer - Standardizes aliases (Bangalore->Bengaluru, Gurgaon->Gurugram) and remote types");
  } catch (err) {
    logFail("India Location Normalizer - Standardizes aliases and remote types", err);
  }

  // TEST 3: Role Family & Seniority Normalization + Non-Tech Exclusions
  try {
    const role1 = normalizeRoleFamily("Senior Backend Engineer (Node.js & Python)");
    assert.strictEqual(role1, "Backend Engineer");

    const role2 = normalizeRoleFamily("Technical Recruiter & Talent Acquisition Manager");
    assert.strictEqual(role2, "Non-Tech");

    const seniority1 = normalizeSeniority("Staff Software Architect", "Architecting distributed systems", 10);
    assert.strictEqual(seniority1, "Lead / Staff / Principal");

    const seniority2 = normalizeSeniority("Junior Frontend Intern", "Recent graduate", 0);
    assert.strictEqual(seniority2, "Intern / Graduate");

    logPass("Role & Seniority Normalizer - Classifies Role Family, Seniority levels, and excludes non-tech roles");
  } catch (err) {
    logFail("Role & Seniority Normalizer - Classifies Role Family and Seniority", err);
  }

  // TEST 4: 7-Factor Scoring Engine & Seniority Penalty
  try {
    const candidateContext = {
      targetRole: "Backend Engineer",
      experienceLevel: "Junior",
      skillsPossessed: {
        technical: ["Node.js", "Express", "MongoDB"]
      },
      skillsTarget: ["Docker", "Kubernetes"]
    };

    const seniorJob = normalizeJob({
      provider: "jobvetta",
      title: "Lead / Principal Backend Engineer",
      company: { name: "Razorpay" },
      location: { raw: "Bengaluru, India" },
      description: "Require 10+ years experience in Node.js, Express, MongoDB, Docker, Kubernetes, Kafka, System Design.",
      skills: ["Node.js", "Express", "MongoDB", "Docker", "Kubernetes", "Kafka", "System Design"],
      url: "https://jobvetta.com/jobs/rzp-1"
    });

    const matchSenior = evaluateJobMatch(candidateContext, seniorJob);
    assert.ok(matchSenior.subscores.seniorityPenalty > 0, "Seniority penalty applied for junior candidate vs Lead job");
    assert.ok(matchSenior.subscores, "Subscores object present in match evaluation");
    assert.strictEqual(typeof matchSenior.subscores.role, "number");

    logPass("7-Factor Scoring Engine - Computes subscores breakdown and applies Seniority Penalty for mismatch");
  } catch (err) {
    logFail("7-Factor Scoring Engine - Computes subscores breakdown and applies Seniority Penalty", err);
  }

  // TEST 5: Roadmap Skill Status Mapping
  try {
    const candidateContext = {
      targetRole: "Full Stack Engineer",
      experienceLevel: "Mid-Level",
      skillsPossessed: ["React", "TypeScript"]
    };

    const job = normalizeJob({
      provider: "indianapi",
      title: "Full Stack Developer",
      company: { name: "Swiggy" },
      skills: ["React", "TypeScript", "Node.js", "Docker"],
      description: "Work with React, TypeScript, Node.js and Docker.",
      url: "https://indianapi.in/jobs/swiggy-1"
    });

    const roadmapProgressMap = {
      completed: new Set(["node.js"]),
      inProgress: new Set(["docker"])
    };

    const matchResult = evaluateJobMatch(candidateContext, job, roadmapProgressMap);

    assert.strictEqual(matchResult.roadmapSkillStatus["Node.js"], "Completed");
    assert.strictEqual(matchResult.roadmapSkillStatus["Docker"], "In Progress");

    logPass("Roadmap Skill Status Integration - Maps missing skills to Candidate Roadmap status (Completed, In Progress, Not Started)");
  } catch (err) {
    logFail("Roadmap Skill Status Integration - Maps missing skills to Candidate Roadmap status", err);
  }

  // TEST 6: Multi-Source Deduplication & Direct Board URL Retention
  try {
    const jobAdzuna = normalizeJob({
      provider: "adzuna",
      title: "Senior Full Stack Engineer",
      company: { name: "Postman" },
      location: { raw: "Bengaluru, Karnataka" },
      description: "Full Stack Developer role",
      url: "https://adzuna.com/job/100",
      source: "Adzuna"
    });

    const jobGreenhouse = normalizeJob({
      provider: "greenhouse",
      title: "Senior Full Stack Engineer",
      company: { name: "Postman" },
      location: { raw: "Bengaluru, Karnataka" },
      description: "Full Stack Developer role",
      url: "https://boards.greenhouse.io/postman/jobs/100",
      source: "Greenhouse"
    });

    const deduplicated = deduplicateJobs([jobAdzuna, jobGreenhouse]);

    assert.strictEqual(deduplicated.length, 1);
    assert.strictEqual(deduplicated[0].url, "https://boards.greenhouse.io/postman/jobs/100", "Greenhouse direct ATS URL preserved over Adzuna");
    assert.ok(deduplicated[0].sources.includes("Adzuna"));
    assert.ok(deduplicated[0].sources.includes("Greenhouse"));

    logPass("Multi-Source Deduplication - Merges multi-source jobs and preserves direct ATS URLs over aggregators");
  } catch (err) {
    logFail("Multi-Source Deduplication - Merges multi-source jobs and preserves direct ATS URLs", err);
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runMultiSourceJobIntelligenceTests();
