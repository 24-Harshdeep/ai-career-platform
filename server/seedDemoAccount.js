/**
 * CareerOS — Demo Account Seed Script
 *
 * Usage:
 *   node seedDemoAccount.js           -- Upsert demo account and all supporting data
 *   node seedDemoAccount.js --reset   -- Delete only demo-owned records, then re-seed
 *
 * Safety guarantees:
 *   - Identifies the demo user exclusively by email (alex@careeros.dev)
 *   - All deletions are scoped to { userId: demoUserId } — never touches other users
 *   - All inserts use upsert / findOneAndUpdate to be idempotent
 *   - Outputs DEMO_USER_ID after seeding for environment variable configuration
 *
 * After running, add the printed DEMO_USER_ID to server/.env and your hosting
 * provider's production environment settings.
 */

const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─── Model Imports ─────────────────────────────────────────────────────────────
const User = require("./src/models/User");
const CareerProfile = require("./src/models/CareerProfile");
const Resume = require("./src/models/Resume");
const ResumeAnalysis = require("./src/models/ResumeAnalysis");
const Roadmap = require("./src/models/Roadmap");
const LearningProgress = require("./src/models/LearningProgress");
const Mission = require("./src/models/Mission");
const Achievement = require("./src/models/Achievement");
const CareerEvent = require("./src/models/CareerEvent");
const AnalyticsSnapshot = require("./src/models/AnalyticsSnapshot");
const WeeklyReport = require("./src/models/WeeklyReport");
const CareerAiSummary = require("./src/models/CareerAiSummary");
const InterviewSession = require("./src/models/InterviewSession");
const InterviewReport = require("./src/models/InterviewReport");
const CoachMessage = require("./src/models/CoachMessage");
const Recommendation = require("./src/models/Recommendation");

// Optional models — import defensively
let DeveloperProfile, GithubRepository, JobOpportunity;
try { DeveloperProfile = require("./src/models/DeveloperProfile"); } catch (_) {}
try { GithubRepository = require("./src/models/GithubRepository"); } catch (_) {}
try { JobOpportunity = require("./src/models/JobOpportunity"); } catch (_) {}

// ─── Constants ─────────────────────────────────────────────────────────────────
const DEMO_EMAIL = "alex@careeros.dev";
const DEMO_PASSWORD = "password123";
const IS_RESET = process.argv.includes("--reset");

// ─── Helpers ───────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function log(msg) { console.log(`[Seeder] ${msg}`); }
function warn(msg) { console.warn(`[Seeder] ⚠  ${msg}`); }

// ─── Delete all demo-owned records safely ──────────────────────────────────────
async function resetDemoData(demoUserId) {
  log("--reset flag detected — deleting all demo-owned records...");
  const uid = demoUserId;

  const models = [
    CareerProfile, Resume, ResumeAnalysis, Roadmap, LearningProgress, Mission,
    Achievement, CareerEvent, AnalyticsSnapshot, WeeklyReport,
    CareerAiSummary, InterviewSession, InterviewReport, CoachMessage,
    Recommendation
  ];

  for (const Model of models) {
    if (!Model) continue;
    const result = await Model.deleteMany({ userId: uid });
    log(`  Deleted ${result.deletedCount} from ${Model.modelName}`);
  }

  // Optional models
  if (DeveloperProfile) await DeveloperProfile.deleteMany({ userId: uid });
  if (GithubRepository) await GithubRepository.deleteMany({ userId: uid });
  if (JobOpportunity) await JobOpportunity.deleteMany({ userId: uid });

  // Delete InterviewReport by sessionId (userId field present on model, use it)
  // Already handled above since InterviewReport has userId field

  log("Reset complete. Re-seeding now...\n");
}

// ─── Main Seed ─────────────────────────────────────────────────────────────────
async function seed() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("[Seeder] ERROR: MONGODB_URI or MONGO_URI must be set in server/.env");
    process.exit(1);
  }

  log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  log("Connected.\n");

  // ── Step 1: Upsert Demo User ──────────────────────────────────────────────
  log("Step 1: Upserting demo user...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  let demoUser = await User.findOne({ email: DEMO_EMAIL });
  if (demoUser) {
    // Update password hash and key stats to ensure realistic display
    demoUser.passwordHash = passwordHash;
    demoUser.name = "Alex Chen";
    demoUser.role = "Senior Full Stack Developer";
    demoUser.goal = "Senior Full Stack Developer";
    demoUser.experience = "Intermediate";
    demoUser.score = 84;
    demoUser.skillsCount = 18;
    demoUser.hasResumeScanned = true;
    demoUser.hasGithubScanned = true;
    demoUser.projectsCount = 4;
    demoUser.masteredQuestionsCount = 12;
    demoUser.streakDays = 9;
    demoUser.longestStreak = 14;
    demoUser.xp = 2450;
    demoUser.level = 3;
    await demoUser.save();
    log(`  Updated existing demo user: ${demoUser._id}`);
  } else {
    demoUser = await User.create({
      name: "Alex Chen",
      email: DEMO_EMAIL,
      passwordHash,
      role: "Senior Full Stack Developer",
      goal: "Senior Full Stack Developer",
      experience: "Intermediate",
      score: 84,
      skillsCount: 18,
      hasResumeScanned: true,
      hasGithubScanned: true,
      projectsCount: 4,
      masteredQuestionsCount: 12,
      streakDays: 9,
      longestStreak: 14,
      xp: 2450,
      level: 3
    });
    log(`  Created demo user: ${demoUser._id}`);
  }

  const uid = demoUser._id;

  // ── Reset if requested ────────────────────────────────────────────────────
  if (IS_RESET) await resetDemoData(uid);

  // ── Step 2: CareerProfile ─────────────────────────────────────────────────
  log("Step 2: Upserting CareerProfile...");
  await CareerProfile.findOneAndUpdate(
    { userId: uid },
    {
      userId: uid,
      targetRole: "Senior Full Stack Developer",
      experienceLevel: "Intermediate",
      careerGoal: "Join a product-led company building developer tools or AI infrastructure",
      currentPhase: "Active Job Search",
      growthMode: "JOB_READINESS",
      skillsPossessed: {
        technical: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express.js"],
        soft: ["Communication", "Problem Solving", "Team Collaboration"],
        tools: ["Git", "VS Code", "Postman", "Figma"],
        frameworks: ["React", "Next.js", "Express.js", "Mongoose"],
        languages: ["JavaScript", "TypeScript", "Python", "SQL"],
        cloud: ["AWS S3", "Vercel", "Cloudinary"],
        devops: ["GitHub Actions", "Docker"]
      },
      skillsTarget: {
        technical: ["TypeScript Advanced", "Kubernetes", "System Design", "GraphQL", "Redis"],
        soft: ["Technical Leadership", "Mentoring"],
        tools: ["Kubernetes", "Terraform"],
        frameworks: ["NestJS", "tRPC"],
        languages: ["Go", "Rust"],
        cloud: ["AWS ECS", "GCP Cloud Run"],
        devops: ["Kubernetes", "Terraform", "ArgoCD"]
      },
      preferredLearningStyle: "Project-based",
      preferredJobType: "Full-time",
      targetCompanies: ["Vercel", "Linear", "Stripe", "Supabase", "Notion"],
      isOnboardingComplete: true,
      aiPersonality: "Career Coach",
      aiResponseLength: "Detailed",
      aiRecommendationFreq: "Daily",
      aiTemperature: 0.5,
      preferredIndustry: "Developer Tooling & AI Infrastructure",
      countryLocale: "US",
      targetSalary: "$140,000 - $175,000",
      workType: "Remote",
      githubUrl: "https://github.com/alexchen-dev",
      linkedinUrl: "https://linkedin.com/in/alexchen-dev",
      themeMode: "Dark",
      accentColor: "Purple",
      interests: [
        { name: "AI / ML Integration", category: "Technology", priority: 1 },
        { name: "Developer Tooling", category: "Domain", priority: 2 },
        { name: "Open Source Contribution", category: "Community", priority: 3 }
      ],
      userPriorities: ["Land senior role", "Close TypeScript gaps", "Build system design skills"],
      userCustomGaps: [
        {
          requirementId: "gap-k8s",
          title: "Kubernetes Orchestration",
          category: "DevOps",
          source: "Job Posting",
          priority: "High",
          addedAt: daysAgo(5)
        }
      ]
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  log("  CareerProfile upserted.");

  // ── Step 3: Resume + ResumeAnalysis (matching actual schemas) ────────────
  log("Step 3: Upserting Resume and ResumeAnalysis...");

  // Resume model requires: userId (unique), filename, storagePath, fileHash, parsedText, versions[]
  let resumeDoc = await Resume.findOne({ userId: uid });
  if (!resumeDoc) {
    resumeDoc = await Resume.create({
      userId: uid,
      filename: "alex_chen_senior_fullstack_resume.pdf",
      storagePath: "demo/alex_chen_resume.pdf",
      fileHash: "demo-hash-alex-chen-2024-v2",
      parsedText: "Alex Chen | Senior Full Stack Developer | alex@careeros.dev\n\nSUMMARY\nSenior Full Stack Developer with 4+ years building scalable web applications and APIs. Specialized in TypeScript, React, Next.js, and Node.js.\n\nEXPERIENCE\nNexus Labs (YC W23) — Senior Full Stack Engineer (Jan 2024 - Present)\n• Architected real-time collaboration platform serving 25,000+ concurrent users\n• Reduced API response latency by 68% through Redis caching\n• Led TypeScript migration of 120,000-line codebase\n\nBuildKit Software — Full Stack Developer (Mar 2022 - Dec 2023)\n• Built RESTful and GraphQL APIs processing 2M+ daily requests\n• Implemented JWT + RBAC authentication\n• CI/CD pipelines reduced deployment time from 45 to 8 minutes\n\nEDUCATION\nUniversity of California, Berkeley — B.S. Computer Science (2022, GPA 3.8)\n\nSKILLS\nTypeScript, JavaScript, React, Next.js, Node.js, Express.js, MongoDB, PostgreSQL, Docker, AWS, GitHub Actions",
      activeVersionId: 2,
      versions: [
        {
          versionNumber: 1,
          title: "Initial Upload",
          optimizationGoal: "ATS Optimization",
          personalInfo: { name: "Alex Chen", email: DEMO_EMAIL, phone: "+1 (555) 234-5678", location: "San Francisco, CA (Remote)", githubUrl: "github.com/alexchen-dev", linkedinUrl: "linkedin.com/in/alexchen-dev", portfolioUrl: "alexchen.dev" },
          summary: "Senior Full Stack Developer with 4+ years of production experience.",
          workExperience: [{ company: "Nexus Labs", position: "Senior Full Stack Engineer", startDate: "Jan 2024", endDate: "Present", currentlyWorking: true, bulletPoints: ["Architected real-time platform serving 25,000+ users"] }],
          skills: { languages: ["TypeScript", "JavaScript", "Python"], frontend: ["React", "Next.js"], backend: ["Node.js", "Express.js"], database: ["MongoDB", "PostgreSQL"], tools: ["Docker", "GitHub Actions", "AWS"] },
          education: [{ institution: "UC Berkeley", degree: "B.S. Computer Science", endDate: "2022", gpa: "3.8" }]
        },
        {
          versionNumber: 2,
          title: "Quantified achievements added",
          optimizationGoal: "ATS Optimization",
          personalInfo: { name: "Alex Chen", email: DEMO_EMAIL, phone: "+1 (555) 234-5678", location: "San Francisco, CA (Remote)", githubUrl: "github.com/alexchen-dev", linkedinUrl: "linkedin.com/in/alexchen-dev", portfolioUrl: "alexchen.dev" },
          summary: "Senior Full Stack Developer with 4+ years building scalable web applications. Reduced API latency 68%, led 120k-line TypeScript migration cutting runtime errors 84%.",
          workExperience: [
            { company: "Nexus Labs (YC W23)", position: "Senior Full Stack Engineer", startDate: "Jan 2024", endDate: "Present", currentlyWorking: true, bulletPoints: ["Architected real-time collaboration platform serving 25,000+ concurrent users using Next.js 15, React Server Components, and WebSocket clusters", "Reduced API response latency by 68% through Redis caching layer and MongoDB compound index optimization", "Led TypeScript migration of 120,000-line codebase, reducing production runtime errors by 84%"] },
            { company: "BuildKit Software", position: "Full Stack Developer", startDate: "Mar 2022", endDate: "Dec 2023", currentlyWorking: false, bulletPoints: ["Built RESTful and GraphQL APIs consumed by 3 frontend apps, processing 2M+ daily requests", "Implemented JWT-based authentication with RBAC, reducing unauthorized access incidents to zero", "CI/CD pipelines using GitHub Actions cut deployment time from 45 to 8 minutes"] }
          ],
          skills: { languages: ["TypeScript", "JavaScript", "Python", "SQL"], frontend: ["React", "Next.js"], backend: ["Node.js", "Express.js", "GraphQL"], database: ["MongoDB", "PostgreSQL", "Redis"], tools: ["Docker", "GitHub Actions", "AWS", "Vercel"] },
          education: [{ institution: "University of California, Berkeley", degree: "B.S. Computer Science", endDate: "2022", gpa: "3.8" }],
          projects: [{ title: "CareerSync — AI-Powered Job Tracker", technologies: ["Next.js 15", "TypeScript", "OpenAI API", "MongoDB", "Stripe"], description: "Full-stack SaaS platform with AI resume scoring", bulletPoints: ["1,200+ active users and $3,400 MRR within 3 months", "AI resume scoring engine with 91% precision"] }],
          certifications: [{ name: "AWS Certified Developer — Associate", issuer: "Amazon Web Services", issueDate: "2023" }]
        }
      ]
    });
    log(`  Resume created: ${resumeDoc._id}`);
  } else {
    log("  Resume already exists — skipped.");
  }

  // ResumeAnalysis requires resumeId FK + missingKeywords as subdocuments {keyword, importance, reason}
  let analysisDoc = await ResumeAnalysis.findOne({ userId: uid });
  if (!analysisDoc) {
    analysisDoc = await ResumeAnalysis.create({
      userId: uid,
      resumeId: resumeDoc._id,
      atsScore: 88,
      breakdown: { keywords: 84, projects: 87, skills: 90, formatting: 91, actionVerbs: 90, quantifiedImpact: 87 },
      missingKeywords: [
        { keyword: "Kubernetes", importance: "High", reason: "Required in 78% of Senior Full Stack postings at target companies", expectedScoreGain: 6, expectedReadinessGain: 9 },
        { keyword: "System Design", importance: "High", reason: "Core senior interview topic not evidenced in resume", expectedScoreGain: 5, expectedReadinessGain: 7 },
        { keyword: "GraphQL Advanced", importance: "Medium", reason: "GraphQL listed but no schema design or federation examples", expectedScoreGain: 3, expectedReadinessGain: 4 },
        { keyword: "tRPC", importance: "Medium", reason: "Modern type-safe API pattern used at target companies (Linear, Vercel)", expectedScoreGain: 2, expectedReadinessGain: 3 },
        { keyword: "Terraform", importance: "Medium", reason: "Infrastructure-as-code not mentioned despite DevOps experience", expectedScoreGain: 2, expectedReadinessGain: 3 }
      ],
      suggestedImprovements: [
        "Add Kubernetes deployment experience or learning project to your portfolio",
        "Include a system design case study in your projects section",
        "Quantify the impact of your GraphQL API work with specific metrics",
        "Add tRPC and Terraform to your tools list if you have hands-on experience"
      ],
      analysisVersion: "v1.0.0",
      analyzedAt: daysAgo(12)
    });
    log("  ResumeAnalysis created.");
  } else {
    log("  ResumeAnalysis already exists — skipped.");
  }

  // ── Step 4: Roadmap (single-track, correct schema) ────────────────────────
  log("Step 4: Upserting Roadmap...");
  await Roadmap.findOneAndUpdate(
    { userId: uid },
    {
      userId: uid,
      id: "personalized-track-senior-fullstack",
      title: "Adaptive Senior Full Stack Developer Track",
      reasoning:
        "Roadmap tailored for Alex's JOB_READINESS growth mode targeting Senior Full Stack roles at developer tooling companies. Prioritizes TypeScript mastery and DevOps fundamentals (Kubernetes) which appear in 78% of target role postings, while leveraging existing React/Node.js expertise as a foundation.",
      modules: [
        {
          id: "mod-1",
          title: "TypeScript & Next.js Excellence",
          subSkills: [
            {
              id: "sub-1-1",
              title: "TypeScript Advanced Types & Generics",
              xpReward: 100,
              time: "3 Hours",
              scoreReward: 5,
              prerequisite: "None",
              unlocks: "React Server Components",
              explanation: "TypeScript advanced generics and utility types appear in 91% of senior Full Stack job postings. Mastering conditional types, mapped types, and template literal types is the highest-leverage skill gap to close.",
              tip: "Build a type-safe API client library using generic types to solidify understanding",
              resources: ["TypeScript Handbook — Advanced Types", "Matt Pocock's Total TypeScript"]
            },
            {
              id: "sub-1-2",
              title: "Next.js App Router & Server Components",
              xpReward: 100,
              time: "4 Hours",
              scoreReward: 6,
              prerequisite: "TypeScript Advanced Types",
              unlocks: "React Server Actions",
              explanation: "Next.js 15 App Router with React Server Components is the primary architecture pattern for modern full-stack React applications. Critical for target companies like Vercel and Linear.",
              tip: "Refactor an existing pages-router project to app-router to experience the paradigm shift",
              resources: ["Next.js 15 Official Docs", "Vercel's Server Component Patterns Guide"]
            },
            {
              id: "sub-1-3",
              title: "React Server Actions & Optimistic UI",
              xpReward: 75,
              time: "2 Hours",
              scoreReward: 4,
              prerequisite: "Next.js App Router",
              unlocks: "Performance Optimization",
              explanation: "Server Actions simplify full-stack data mutations without API routes. Optimistic UI patterns with useOptimistic() are expected knowledge for senior React roles.",
              tip: "Implement a complete CRUD feature using only Server Actions and optimistic updates",
              resources: ["React Docs — Server Actions", "Next.js Forms and Mutations Guide"]
            },
            {
              id: "sub-1-4",
              title: "Performance Optimization & Core Web Vitals",
              xpReward: 75,
              time: "3 Hours",
              scoreReward: 4,
              prerequisite: "React Server Actions",
              unlocks: "Module 2",
              explanation: "CWV (LCP, INP, CLS) measurement and optimization is a top differentiator for senior roles. Demonstrates production-grade engineering mindset.",
              tip: "Use Chrome DevTools Lighthouse CI to identify and fix LCP bottlenecks in your portfolio project",
              resources: ["web.dev/performance", "Next.js Image and Font Optimization Docs"]
            }
          ]
        },
        {
          id: "mod-2",
          title: "Backend Architecture & System Design",
          subSkills: [
            {
              id: "sub-2-1",
              title: "Express.js Middleware Architecture",
              xpReward: 75,
              time: "2 Hours",
              scoreReward: 3,
              prerequisite: "None",
              unlocks: "MongoDB Schema Design",
              explanation: "Deep understanding of Express middleware chains, error handling, and custom middleware patterns is foundational for all Node.js backend work.",
              tip: "Build a custom request validation middleware using Zod schema inference",
              resources: ["Express.js Official Docs", "Node.js Best Practices GitHub"]
            },
            {
              id: "sub-2-2",
              title: "MongoDB Schema Design & Indexing",
              xpReward: 75,
              time: "3 Hours",
              scoreReward: 4,
              prerequisite: "Express Middleware",
              unlocks: "JWT Authentication",
              explanation: "Proper schema design with compound indexes, embedded vs referenced documents, and aggregation pipeline optimization directly impacts application performance at scale.",
              tip: "Use explain() to analyze query plans and verify index coverage on existing collections",
              resources: ["MongoDB University — Data Modeling", "Mongoose Documentation"]
            },
            {
              id: "sub-2-3",
              title: "JWT Authentication & RBAC",
              xpReward: 75,
              time: "2 Hours",
              scoreReward: 3,
              prerequisite: "MongoDB Schema Design",
              unlocks: "REST API Design",
              explanation: "Secure JWT implementation with refresh token rotation, RBAC permission systems, and OWASP security best practices is essential for production systems.",
              tip: "Implement refresh token rotation with Redis storage in a sample auth service",
              resources: ["OWASP JWT Security Cheat Sheet", "Auth0 Node.js Security Best Practices"]
            },
            {
              id: "sub-2-4",
              title: "REST API Design & OpenAPI Documentation",
              xpReward: 50,
              time: "2 Hours",
              scoreReward: 3,
              prerequisite: "JWT Authentication",
              unlocks: "Module 3",
              explanation: "API design using REST conventions with OpenAPI/Swagger spec generation demonstrates engineering maturity sought by senior hiring managers.",
              tip: "Generate an OpenAPI spec from your CareerSync project and publish it as API documentation",
              resources: ["OpenAPI Specification", "Swagger UI Integration Guide"]
            }
          ]
        },
        {
          id: "mod-3",
          title: "DevOps & Cloud Deployment",
          subSkills: [
            {
              id: "sub-3-1",
              title: "Docker Multi-stage Builds",
              xpReward: 100,
              time: "3 Hours",
              scoreReward: 5,
              prerequisite: "None",
              unlocks: "CI/CD Pipelines",
              explanation: "Docker multi-stage builds for production Node.js and Next.js apps reduces image sizes by 70-80% and is required knowledge in 73% of senior Full Stack postings.",
              tip: "Write a multi-stage Dockerfile for your Next.js app and measure the final image size reduction",
              resources: ["Docker Multi-stage Builds Docs", "Dockerfile Best Practices Guide"]
            },
            {
              id: "sub-3-2",
              title: "CI/CD with GitHub Actions",
              xpReward: 75,
              time: "2 Hours",
              scoreReward: 4,
              prerequisite: "Docker Multi-stage Builds",
              unlocks: "Kubernetes Fundamentals",
              explanation: "GitHub Actions pipelines for test, lint, build, and deploy automation are standard in product-led companies and directly evaluate engineering culture fit.",
              tip: "Add a full test + build + deploy workflow to your CareerSync repository",
              resources: ["GitHub Actions Docs", "Turborepo CI/CD Recipes"]
            },
            {
              id: "sub-3-3",
              title: "Kubernetes Fundamentals",
              xpReward: 150,
              time: "5 Hours",
              scoreReward: 8,
              prerequisite: "CI/CD GitHub Actions",
              unlocks: "AWS Cloud Architecture",
              explanation: "Kubernetes orchestration appears in 78% of senior Full Stack Developer postings at developer tooling companies. Understanding Deployments, Services, and ConfigMaps is the highest priority gap for Alex's target roles.",
              tip: "Deploy your CareerSync app on a local minikube cluster to solidify Kubernetes concepts",
              resources: ["Kubernetes Official Tutorial", "KodeKloud Kubernetes for Beginners"]
            },
            {
              id: "sub-3-4",
              title: "AWS Architecture & Cloud Services",
              xpReward: 100,
              time: "4 Hours",
              scoreReward: 6,
              prerequisite: "Kubernetes Fundamentals",
              unlocks: "Career Readiness",
              explanation: "AWS (EC2, ECS, RDS, S3, CloudFront) architecture knowledge is required by 65% of senior roles at target companies. Complements existing AWS S3 experience.",
              tip: "Complete the AWS Developer Associate practice exam to identify knowledge gaps",
              resources: ["AWS Free Tier Hands-on Labs", "Stephane Maarek's AWS Developer Course"]
            }
          ]
        }
      ],
      versionNumber: 2,
      lastAdaptedReason: "INITIAL_GENERATION",
      changeHistory: [
        {
          versionNumber: 1,
          reason: "INITIAL_GENERATION",
          summary: "Initial personalized roadmap generated for Senior Full Stack Developer target role.",
          timestamp: daysAgo(30)
        },
        {
          versionNumber: 2,
          reason: "TARGET_ROLE_CHANGED",
          summary: "Roadmap updated after Kubernetes gap added from job posting analysis.",
          timestamp: daysAgo(5)
        }
      ],
      pendingProposals: []
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  log("  Roadmap upserted (3 modules, 12 subSkills).");

  // ── Step 5: LearningProgress (5 completed subSkills) ──────────────────────
  log("Step 5: Upserting LearningProgress records...");
  const completedSubSkills = [
    { subSkillId: "sub-1-1", xpEarned: 100, completedAt: daysAgo(28) },
    { subSkillId: "sub-1-2", xpEarned: 100, completedAt: daysAgo(21) },
    { subSkillId: "sub-2-1", xpEarned: 75,  completedAt: daysAgo(18) },
    { subSkillId: "sub-2-2", xpEarned: 75,  completedAt: daysAgo(11) },
    { subSkillId: "sub-2-3", xpEarned: 75,  completedAt: daysAgo(6) }
  ];

  for (const item of completedSubSkills) {
    await LearningProgress.findOneAndUpdate(
      { userId: uid, subSkillId: item.subSkillId },
      { userId: uid, ...item, completed: true },
      { upsert: true, new: true }
    );
  }
  log(`  ${completedSubSkills.length} LearningProgress records upserted.`);

  // ── Step 6: Missions (3 pre-seeded — dashboard never calls Gemini) ─────────
  log("Step 6: Upserting Missions...");
  const missions = [
    { title: "Practice one TypeScript advanced generics challenge", scoreReward: 3 },
    { title: "Review Kubernetes Deployment YAML configuration", scoreReward: 4 },
    { title: "Add optimistic UI update to CareerSync using useOptimistic()", scoreReward: 3 }
  ];

  // Only insert missions if fewer than 3 active ones exist
  const existingMissions = await Mission.countDocuments({ userId: uid, completed: false });
  if (existingMissions < 3) {
    for (const m of missions) {
      const exists = await Mission.findOne({ userId: uid, title: m.title });
      if (!exists) {
        await Mission.create({ userId: uid, ...m, completed: false });
      }
    }
    log("  Missions seeded.");
  } else {
    log("  Missions already present — skipped.");
  }

  // ── Step 7: CareerEvents (16 activity logs over 60 days) ──────────────────
  log("Step 7: Upserting CareerEvents...");
  const events = [
    { eventType: "RESUME_SCANNED",     source: "Resume Engine",    metadata: { atsScore: 88 },                pointsEarned: 10, daysBack: 30 },
    { eventType: "GITHUB_SYNCED",      source: "GitHub Engine",    metadata: { repoCount: 4 },                pointsEarned: 10, daysBack: 29 },
    { eventType: "ROADMAP_STARTED",    source: "Roadmap Engine",   metadata: { trackId: "personalized-track-senior-fullstack" }, pointsEarned: 5, daysBack: 28 },
    { eventType: "ROADMAP_PROGRESS",   source: "Roadmap Engine",   metadata: { subSkillId: "sub-1-1", progress: 100 }, pointsEarned: 8, daysBack: 28 },
    { eventType: "PROFILE_UPDATED",    source: "SETTINGS",         metadata: { targetRole: "Senior Full Stack Developer" }, pointsEarned: 2, daysBack: 25 },
    { eventType: "ROADMAP_PROGRESS",   source: "Roadmap Engine",   metadata: { subSkillId: "sub-1-2", progress: 100 }, pointsEarned: 8, daysBack: 21 },
    { eventType: "INTERVIEW_COMPLETED",source: "Interview Engine", metadata: { score: 78, role: "Senior Full Stack Developer" }, pointsEarned: 15, daysBack: 18 },
    { eventType: "ROADMAP_PROGRESS",   source: "Roadmap Engine",   metadata: { subSkillId: "sub-2-1", progress: 100 }, pointsEarned: 6, daysBack: 18 },
    { eventType: "MISSION_COMPLETED",  source: "Mission Control",  metadata: { missionTitle: "Complete first mock interview" }, pointsEarned: 10, daysBack: 15 },
    { eventType: "ROADMAP_PROGRESS",   source: "Roadmap Engine",   metadata: { subSkillId: "sub-2-2", progress: 100 }, pointsEarned: 8, daysBack: 11 },
    { eventType: "RESUME_OPTIMIZED",   source: "Resume Engine",    metadata: { goal: "Senior Full Stack Developer" }, pointsEarned: 5, daysBack: 10 },
    { eventType: "JOB_SAVED",          source: "Job Tracker",      metadata: { company: "Vercel", role: "Senior Software Engineer" }, pointsEarned: 2, daysBack: 8 },
    { eventType: "ROADMAP_PROGRESS",   source: "Roadmap Engine",   metadata: { subSkillId: "sub-2-3", progress: 100 }, pointsEarned: 8, daysBack: 6 },
    { eventType: "JOB_APPLIED",        source: "Job Tracker",      metadata: { company: "Linear", role: "Full Stack Engineer" }, pointsEarned: 5, daysBack: 5 },
    { eventType: "PROFILE_UPDATED",    source: "SETTINGS",         metadata: { userCustomGaps: ["Kubernetes"] }, pointsEarned: 2, daysBack: 5 },
    { eventType: "MISSION_COMPLETED",  source: "Mission Control",  metadata: { missionTitle: "Update target skills list" }, pointsEarned: 10, daysBack: 3 }
  ];

  const existingEventCount = await CareerEvent.countDocuments({ userId: uid });
  if (existingEventCount < events.length) {
    await CareerEvent.deleteMany({ userId: uid });
    for (const e of events) {
      const { daysBack, ...eventData } = e;
      await CareerEvent.create({
        userId: uid,
        ...eventData,
        createdAt: daysAgo(daysBack)
      });
    }
    log(`  ${events.length} CareerEvents seeded.`);
  } else {
    log("  CareerEvents already present — skipped.");
  }

  // ── Step 8: AnalyticsSnapshots (8 weekly score snapshots) ─────────────────
  log("Step 8: Upserting AnalyticsSnapshots...");
  const snapshots = [
    { careerScore: 65, resumeScore: 72, developerScore: 68, projectScore: 62, roadmapScore: 25, interviewScore: 0,  jobReadiness: 45, interviewReadiness: 30, portfolioReadiness: 55, weeklyGrowth: 0,  monthlyGrowth: 0,  weeksBack: 7 },
    { careerScore: 68, resumeScore: 72, developerScore: 71, projectScore: 65, roadmapScore: 30, interviewScore: 0,  jobReadiness: 48, interviewReadiness: 30, portfolioReadiness: 58, weeklyGrowth: 3,  monthlyGrowth: 3,  weeksBack: 6 },
    { careerScore: 72, resumeScore: 80, developerScore: 74, projectScore: 68, roadmapScore: 38, interviewScore: 0,  jobReadiness: 52, interviewReadiness: 30, portfolioReadiness: 62, weeklyGrowth: 4,  monthlyGrowth: 7,  weeksBack: 5 },
    { careerScore: 75, resumeScore: 84, developerScore: 77, projectScore: 71, roadmapScore: 44, interviewScore: 0,  jobReadiness: 56, interviewReadiness: 35, portfolioReadiness: 65, weeklyGrowth: 3,  monthlyGrowth: 10, weeksBack: 4 },
    { careerScore: 78, resumeScore: 85, developerScore: 80, projectScore: 74, roadmapScore: 50, interviewScore: 78, jobReadiness: 61, interviewReadiness: 62, portfolioReadiness: 70, weeklyGrowth: 3,  monthlyGrowth: 13, weeksBack: 3 },
    { careerScore: 80, resumeScore: 87, developerScore: 82, projectScore: 77, roadmapScore: 54, interviewScore: 78, jobReadiness: 65, interviewReadiness: 65, portfolioReadiness: 73, weeklyGrowth: 2,  monthlyGrowth: 15, weeksBack: 2 },
    { careerScore: 82, resumeScore: 88, developerScore: 84, projectScore: 80, roadmapScore: 58, interviewScore: 78, jobReadiness: 68, interviewReadiness: 67, portfolioReadiness: 75, weeklyGrowth: 2,  monthlyGrowth: 17, weeksBack: 1 },
    { careerScore: 84, resumeScore: 88, developerScore: 85, projectScore: 82, roadmapScore: 62, interviewScore: 78, jobReadiness: 71, interviewReadiness: 69, portfolioReadiness: 78, weeklyGrowth: 2,  monthlyGrowth: 19, weeksBack: 0 }
  ];

  const existingSnapshots = await AnalyticsSnapshot.countDocuments({ userId: uid });
  if (existingSnapshots < 8) {
    await AnalyticsSnapshot.deleteMany({ userId: uid });
    for (const s of snapshots) {
      const { weeksBack, ...snapshotData } = s;
      const d = new Date();
      d.setDate(d.getDate() - weeksBack * 7);
      await AnalyticsSnapshot.create({
        userId: uid,
        ...snapshotData,
        createdAt: d
      });
    }
    log("  8 AnalyticsSnapshots seeded.");
  } else {
    log("  AnalyticsSnapshots already present — skipped.");
  }

  // ── Step 9: Achievements (4 badges) ───────────────────────────────────────
  log("Step 9: Upserting Achievements...");
  const achievements = [
    { achievementId: "resume-uploaded",  title: "Resume Uploaded",       description: "Successfully uploaded and analyzed your first resume.",            daysBack: 30 },
    { achievementId: "github-connected", title: "GitHub Connected",       description: "Linked and analyzed your GitHub developer profile.",               daysBack: 29 },
    { achievementId: "streak-7",         title: "7-Day Streak Champion",  description: "Completed career development activities 7 days in a row!",        daysBack: 14 },
    { achievementId: "first-interview",  title: "Interview Debut",        description: "Completed your first AI-powered mock interview session.",          daysBack: 18 }
  ];

  for (const a of achievements) {
    const { achievementId, daysBack, ...achievementData } = a;
    await Achievement.findOneAndUpdate(
      { userId: uid, title: achievementData.title },
      { userId: uid, ...achievementData, createdAt: daysAgo(daysBack) },
      { upsert: true, new: true }
    );
  }
  log("  4 Achievements upserted.");

  // ── Step 10: InterviewSession + InterviewReport ────────────────────────────
  log("Step 10: Upserting InterviewSession and InterviewReport...");
  let sessionDoc = await InterviewSession.findOne({ userId: uid });
  let reportDoc = null;

  if (!sessionDoc) {
    sessionDoc = await InterviewSession.create({
      userId: uid,
      role: "Senior Full Stack Developer",
      type: "Technical",
      difficulty: "Intermediate",
      formatMode: "written",
      status: "Completed",
      startedAt: daysAgo(18),
      completedAt: new Date(daysAgo(18).getTime() + 22 * 60 * 1000),
      duration: 22,
      totalQuestions: 3,
      currentQuestionIndex: 3,
      overallScore: 78,
      ratings: {
        technicalKnowledge: 80,
        problemSolving: 75,
        communication: 82,
        answerQuality: 77,
        confidence: 74,
        roleRelevance: 80
      },
      technicalScore: 80,
      communicationScore: 82,
      problemSolvingScore: 75,
      confidenceScore: 74,
      timeManagementScore: 85,
      readinessIncrease: 8,
      feedbackSummary: "Strong TypeScript and React fundamentals. Needs deeper Kubernetes and system design experience for senior-level expectations. Communication was clear and structured.",
      recommendations: [
        "Study Kubernetes Deployments and Services to close the DevOps gap",
        "Practice system design — design a URL shortener and a distributed cache",
        "Add quantified impact metrics to behavioral answers using the STAR method"
      ]
    });

    reportDoc = await InterviewReport.create({
      sessionId: sessionDoc._id,
      userId: uid,
      role: "Senior Full Stack Developer",
      type: "Technical",
      difficulty: "Intermediate",
      formatMode: "written",
      overallScore: 78,
      subscores: {
        technicalKnowledge: 80,
        problemSolving: 75,
        communication: 82,
        answerQuality: 77,
        confidence: 74,
        roleRelevance: 80
      },
      strengths: [
        "Deep TypeScript and React expertise with production experience",
        "Clear, well-structured communication with concrete examples",
        "Strong knowledge of JWT authentication and MongoDB indexing"
      ],
      weakAreas: [
        "Kubernetes and container orchestration knowledge is below senior-level expectations",
        "System design answers lacked distributed system considerations"
      ],
      repeatedMistakes: [
        "Omitted time/space complexity analysis in algorithm questions",
        "Kubernetes-related questions answered with Docker-only context"
      ],
      qaAnalysis: [
        {
          question: "Explain how you would design a type-safe REST API layer in a large TypeScript project.",
          answer: "I would use a schema validation library like Zod to define request/response types at the API boundary, then use those Zod schemas to infer TypeScript types throughout the codebase. I'd create a typed fetch wrapper using generics to ensure end-to-end type safety...",
          score: 85,
          strengths: ["Excellent use of Zod + TypeScript integration", "Mentioned generic fetch wrapper pattern"],
          weaknesses: ["Did not mention OpenAPI spec generation from schemas"],
          idealAnswer: "The ideal answer covers Zod schema inference, typed fetch wrappers, OpenAPI spec generation (e.g., via zod-to-openapi), and tRPC as an alternative pattern.",
          coachAdvice: "Add tRPC and zod-to-openapi to your answer for a more complete senior-level response."
        },
        {
          question: "How would you design a real-time collaborative feature for 10,000 concurrent users?",
          answer: "I would use WebSockets through Socket.io with Redis pub/sub to synchronize state across multiple server instances. Implement optimistic UI on the client and handle conflict resolution with CRDT data structures...",
          score: 78,
          strengths: ["Correctly identified Redis pub/sub for multi-instance sync", "Mentioned CRDT for conflict resolution"],
          weaknesses: ["Did not address Kubernetes horizontal pod autoscaling for traffic spikes", "Load balancer sticky sessions not mentioned"],
          idealAnswer: "Complete answer includes: WebSocket clustering with Redis Adapter, Kubernetes HPA for autoscaling, sticky session configuration on the load balancer, and graceful reconnection on the client.",
          coachAdvice: "Strengthen your Kubernetes knowledge to speak credibly about horizontal scaling in system design answers."
        },
        {
          question: "Walk me through how you would debug a performance regression in a Next.js production application.",
          answer: "I would start with Core Web Vitals data from Google Search Console and Chrome UX Report to identify which metrics degraded. Then use Lighthouse CI to reproduce locally, analyze bundle sizes with next bundle-analyzer...",
          score: 82,
          strengths: ["Systematic debugging approach starting from user-visible metrics", "Mentioned bundle analysis tools"],
          weaknesses: ["Did not mention server-side profiling or database query analysis"],
          idealAnswer: "Best answer also covers: server-side profiling with clinic.js, MongoDB slow query logs, N+1 query detection, and React Server Component rendering analysis.",
          coachAdvice: "Include server-side profiling and database analysis in your debugging process for a complete senior-level answer."
        }
      ],
      recommendedTopics: ["Kubernetes & Container Orchestration", "Distributed Systems Design", "System Design Interviews"],
      recommendedPractice: ["Design a URL shortener at scale", "Practice Kubernetes YAML configuration", "Study CAP theorem and consistency models"],
      nextBestAction: "Complete the Kubernetes Fundamentals module in your roadmap to close the most critical skill gap identified in this interview."
    });

    await InterviewSession.findByIdAndUpdate(sessionDoc._id, { reportId: reportDoc._id });
    log("  InterviewSession + InterviewReport created.");
  } else {
    log("  InterviewSession already exists — skipped.");
  }

  // ── Step 11: WeeklyReport ─────────────────────────────────────────────────
  log("Step 11: Upserting WeeklyReport...");
  const existingWeeklyReport = await WeeklyReport.findOne({ userId: uid });
  if (!existingWeeklyReport) {
    await WeeklyReport.create({
      userId: uid,
      summary: "Strong week — completed MongoDB Indexing and JWT Authentication modules. Career score increased by 2 points to 84. Interview readiness up to 69%. Priority this week: begin Kubernetes Fundamentals module to close the most critical gap for target Senior Full Stack roles.",
      completedTasksCount: 3,
      pointsEarned: 24,
      categoryDelta: {
        resume: 0,
        github: 1,
        roadmap: 4,
        interview: 2,
        job: 0
      },
      nextWeekFocus: [
        "Complete Kubernetes Fundamentals (sub-3-3)",
        "Add Docker multi-stage build to CareerSync portfolio project",
        "Apply to 2 senior Full Stack roles at target companies (Vercel, Linear)"
      ],
      createdAt: daysAgo(2)
    });
    log("  WeeklyReport created.");
  } else {
    log("  WeeklyReport already exists — skipped.");
  }

  // ── Step 12: CareerAiSummary (pre-generated — skips Gemini on load) ────────
  log("Step 12: Upserting CareerAiSummary...");
  await CareerAiSummary.findOneAndUpdate(
    { userId: uid },
    {
      userId: uid,
      content: `Alex Chen is an Intermediate Full Stack Developer actively targeting a Senior Full Stack Developer role at developer tooling and AI infrastructure companies. Alex has strong foundations in TypeScript, React, Next.js, and Node.js with 4+ years of production experience, demonstrated by quantified achievements like reducing API latency by 68% and leading a TypeScript migration that cut production errors by 84%.

**Top Strengths:** Production-grade React and Next.js expertise, strong MongoDB optimization skills, clean JWT authentication implementation, and excellent communication backed by concrete project evidence.

**Critical Gaps:** Kubernetes orchestration is the highest-priority gap — appearing in 78% of target role postings. System design depth and DevOps automation (Terraform, ArgoCD) also need development before Senior-level readiness.

**Current Score: 84/100 — Job Readiness: 71%**

**Recommended Focus:** Complete the Kubernetes Fundamentals module this week. Then tackle the AWS Architecture module and integrate a Docker + Kubernetes deployment story into your CareerSync portfolio project. This combination directly addresses the gap pattern seen across your target companies (Vercel, Linear, Stripe, Supabase).

**Estimated Time to Senior Readiness:** 4-6 weeks at current pace.`,
      targetRole: "Senior Full Stack Developer",
      careerGoal: "Join a product-led company building developer tools or AI infrastructure",
      experienceLevel: "Intermediate",
      versionNumber: 2,
      status: "CURRENT",
      generatedAt: daysAgo(2)
    },
    { upsert: true, new: true }
  );
  log("  CareerAiSummary upserted.");

  // ── Step 13: CoachMessage (welcome message) ────────────────────────────────
  log("Step 13: Upserting CoachMessage...");
  const existingCoachMsg = await CoachMessage.findOne({ userId: uid });
  if (!existingCoachMsg) {
    await CoachMessage.create({
      userId: uid,
      sender: "coach",
      text: "👋 Hey Alex! I've analyzed your career profile, roadmap progress, and recent interview performance. Your score is at **84/100** — great momentum! Your most critical gap right now is **Kubernetes**, which appears in 78% of Senior Full Stack postings at your target companies. I'd recommend starting the Kubernetes Fundamentals module in your roadmap this week. Want me to build a 7-day study plan for it?",
      activePath: "/dashboard",
      sessionId: "demo-session-welcome",
      createdAt: daysAgo(1)
    });
    log("  CoachMessage created.");
  } else {
    log("  CoachMessage already exists — skipped.");
  }

  // ── Step 14: Recommendation (pre-seeded, no AI call needed) ───────────────
  log("Step 14: Upserting Recommendation...");
  await Recommendation.findOneAndUpdate(
    { userId: uid, actionId: "action-kubernetes-fundamentals" },
    {
      userId: uid,
      actionId: "action-kubernetes-fundamentals",
      title: "Complete Kubernetes Fundamentals Module",
      description: "Kubernetes orchestration is required in 78% of active Senior Full Stack Developer postings at your target companies (Vercel, Linear, Stripe). Completing this module will be the highest-impact action to close your most critical skill gap.",
      type: "Learning",
      priority: "High",
      impactScore: 95,
      estimatedTime: "5 hours",
      confidence: 92,
      reason: "Market intelligence shows Kubernetes in 78% of Senior Full Stack postings. Your interview feedback also identified this as the top gap. Closing it unlocks the AWS Architecture module and completes the DevOps track.",
      dependencies: ["sub-3-1", "sub-3-2"],
      status: "Active",
      completedAt: null
    },
    { upsert: true, new: true }
  );
  log("  Recommendation upserted.");

  // ── Step 15: Seed Developer Profile if model exists ────────────────────────
  if (DeveloperProfile) {
    log("Step 15: Upserting DeveloperProfile...");
    await DeveloperProfile.findOneAndUpdate(
      { userId: uid },
      {
        userId: uid,
        githubUsername: "alexchen-dev",
        githubUrl: "https://github.com/alexchen-dev",
        profileScore: 85,
        repoCount: 4,
        totalCommits: 847,
        totalStars: 124,
        totalForks: 31,
        primaryLanguages: ["TypeScript", "JavaScript", "Python"],
        missingPractices: ["Kubernetes deployment manifests", "Terraform infrastructure-as-code"],
        strengths: ["Consistent commit history", "Well-documented READMEs", "Production CI/CD pipelines"],
        analyzedAt: daysAgo(10)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    log("  DeveloperProfile upserted.");
  }

  // ── Step 16: Seed JobOpportunities if model exists ────────────────────────
  if (JobOpportunity) {
    log("Step 16: Seeding JobOpportunity pipeline...");
    const existingJobs = await JobOpportunity.countDocuments({ userId: uid });
    if (existingJobs < 3) {
      await JobOpportunity.deleteMany({ userId: uid });
      const jobs = [
        {
          title: "Senior Software Engineer",
          company: "Vercel",
          location: "Remote",
          salaryRange: "$160,000 - $200,000",
          status: "Interview",
          description: "Build and scale the infrastructure powering the world's frontend deployment platform.",
          matchScore: 82,
          appliedAt: daysAgo(5)
        },
        {
          title: "Full Stack Engineer",
          company: "Linear",
          location: "Remote",
          salaryRange: "$150,000 - $185,000",
          status: "Applied",
          description: "Help build the issue tracker that replaces Jira.",
          matchScore: 88,
          appliedAt: daysAgo(8)
        },
        {
          title: "Senior Full Stack Developer",
          company: "Supabase",
          location: "Remote",
          salaryRange: "$145,000 - $180,000",
          status: "Saved",
          description: "Build the open-source Firebase alternative used by 50,000+ developers.",
          matchScore: 91,
          appliedAt: null
        }
      ];
      for (const job of jobs) {
        await JobOpportunity.create({ userId: uid, ...job });
      }
      log("  3 JobOpportunities seeded.");
    } else {
      log("  JobOpportunities already present — skipped.");
    }
  }

  // ── Final Output ───────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("[Seeder] DEMO ACCOUNT READY");
  console.log("=".repeat(60));
  console.log(`  Email:           ${DEMO_EMAIL}`);
  console.log(`  Password:        ${DEMO_PASSWORD}  (public demo — no real data)`);
  console.log(`  DEMO_USER_ID:    ${uid}`);
  console.log("\n  ► Add to server/.env:");
  console.log(`  DEMO_USER_ID=${uid}`);
  console.log("\n  ► Add to production hosting environment:");
  console.log(`  DEMO_USER_ID=${uid}`);
  console.log("=".repeat(60) + "\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("[Seeder] Fatal error:", err);
  mongoose.disconnect();
  process.exit(1);
});
