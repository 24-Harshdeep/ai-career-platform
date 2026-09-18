/**
 * CareerOS — Official Demo Account Seeder
 * Idempotently provisions the official demonstration user (alex@careeros.dev)
 * with a complete, internally consistent career intelligence dataset.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { connectDB } = require("./src/config/db");

const User = require("./src/models/User");
const CareerProfile = require("./src/models/CareerProfile");
const DeveloperProfile = require("./src/models/DeveloperProfile");
const GithubRepository = require("./src/models/GithubRepository");
const GithubRepositoryAnalysis = require("./src/models/GithubRepositoryAnalysis");
const Resume = require("./src/models/Resume");
const ResumeAnalysis = require("./src/models/ResumeAnalysis");
const JobOpportunity = require("./src/models/JobOpportunity");
const InterviewSession = require("./src/models/InterviewSession");
const Roadmap = require("./src/models/Roadmap");
const CoachMessage = require("./src/models/CoachMessage");
const AnalyticsSnapshot = require("./src/models/AnalyticsSnapshot");

async function seedDemoAccount() {
  await connectDB();
  console.log("[Seeder] Connected to MongoDB. Seeding official demo account...");

  const demoEmail = "alex@careeros.dev";

  // 1. Provision Demo User
  let user = await User.findOne({ email: demoEmail });
  if (!user) {
    user = await User.create({
      name: "Alex Chen",
      email: demoEmail,
      passwordHash: "$2a$10$e846059955700cf11c50bu2vOq71.8zY46/kZp7L5P4V0hQZk.d86",
      role: "Senior Full Stack Developer",
      goal: "Senior Full Stack Developer",
      experience: "Advanced",
      score: 84,
      streakDays: 7,
      longestStreak: 14,
      hasResumeScanned: true,
      hasGithubScanned: true,
      projectsCount: 4,
      skillsCount: 18,
      masteredQuestionsCount: 12
    });
    console.log("[Seeder] Created demo user:", user._id);
  } else {
    user.score = 84;
    user.streakDays = 7;
    user.hasResumeScanned = true;
    user.hasGithubScanned = true;
    await user.save();
    console.log("[Seeder] Found existing demo user:", user._id);
  }

  const userId = user._id;

  // 2. Career Profile
  await CareerProfile.findOneAndUpdate(
    { userId },
    {
      userId,
      targetRole: "Senior Full Stack Developer",
      experienceLevel: "Advanced",
      careerGoal: "Lead engineering teams building high-scale TypeScript SaaS platforms.",
      strengths: ["React 19 & Next.js App Router", "Node.js REST Architectures", "PostgreSQL & MongoDB Optimization", "Docker Multi-stage Builds"],
      weaknesses: ["Kubernetes Cluster Orchestration", "GraphQL Federation"],
      skillsPossessed: {
        languages: ["JavaScript", "TypeScript", "SQL", "Python"],
        frontend: ["React", "Next.js", "Tailwind CSS", "Redux Toolkit"],
        backend: ["Node.js", "Express.js", "REST APIs", "GraphQL"],
        database: ["MongoDB", "PostgreSQL", "Redis"],
        tools: ["Git", "Docker", "Jest", "CI/CD"]
      },
      skillsTarget: ["TypeScript", "Next.js", "Node.js", "Docker", "MongoDB", "PostgreSQL", "Kubernetes"],
      githubUrl: "https://github.com/alexchen-dev",
      linkedinUrl: "https://linkedin.com/in/alexchen-dev",
      portfolioUrl: "https://alexchen.dev",
      isOnboardingComplete: true
    },
    { upsert: true, new: true }
  );

  // 3. Developer Profile & Repositories
  const devProfile = await DeveloperProfile.findOneAndUpdate(
    { userId },
    {
      userId,
      overallHealth: 88,
      engineeringLevel: "Advanced",
      repositoryCount: 4,
      bestRepository: "careeros-monorepo",
      weakestRepository: "docker-ci-pipeline",
      languageDistribution: { TypeScript: 50, JavaScript: 30, Python: 15, Shell: 5 },
      missingPractices: ["Add Kubernetes manifests", "Increase Jest test coverage to 90%"],
      lastAnalysis: new Date()
    },
    { upsert: true, new: true }
  );

  const demoRepos = [
    { name: "careeros-monorepo", description: "AI Career Operating System monorepo built with Next.js 16 and Express.", language: "TypeScript", stars: 14, health: 92 },
    { name: "express-auth-microservice", description: "JWT & OAuth2 stateless authentication microservice with Redis session cache.", language: "JavaScript", stars: 8, health: 85 },
    { name: "react-dashboard-design", description: "Modern responsive dashboard design system with Tailwind CSS and Recharts.", language: "TypeScript", stars: 5, health: 88 },
    { name: "docker-ci-pipeline", description: "Multi-stage Dockerized deployment pipeline for Node.js microservices.", language: "Shell", stars: 3, health: 78 }
  ];

  for (const repoData of demoRepos) {
    const repo = await GithubRepository.findOneAndUpdate(
      { userId, name: repoData.name },
      {
        userId,
        name: repoData.name,
        description: repoData.description,
        url: `https://github.com/alexchen-dev/${repoData.name}`,
        primaryLanguage: repoData.language,
        stars: repoData.stars,
        forks: 2,
        lastSyncedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await GithubRepositoryAnalysis.findOneAndUpdate(
      { repositoryId: repo._id },
      {
        repositoryId: repo._id,
        healthScore: repoData.health,
        documentationScore: 90,
        testingScore: 85,
        architectureScore: 90,
        activityScore: 88,
        maintainabilityScore: 92,
        securityScore: 85,
        missingPractices: ["Add unit test badges to README"]
      },
      { upsert: true, new: true }
    );
  }

  // 4. Resume & Resume Analysis
  let resume = await Resume.findOne({ userId });
  if (!resume) {
    resume = await Resume.create({
      userId,
      filename: "alex_chen_senior_fullstack_resume.pdf",
      storagePath: "uploads/resumes/alex_chen_resume.pdf",
      fileHash: "hash_alex_chen_demo_resume_12345",
      parsedText: "Alex Chen - Senior Full Stack Engineer. Skilled in React, Next.js, TypeScript, Node.js, Express, MongoDB, Docker, PostgreSQL.",
      activeVersionId: 1
    });
  }

  await ResumeAnalysis.findOneAndUpdate(
    { userId, resumeId: resume._id },
    {
      userId,
      resumeId: resume._id,
      atsScore: 88,
      missingKeywords: [
        { keyword: "Kubernetes", importance: "High", reason: "Required for senior infrastructure automation" },
        { keyword: "GraphQL Federation", importance: "Medium", reason: "Preferred for distributed API gateways" }
      ],
      identifiedSkills: ["TypeScript", "React", "Next.js", "Node.js", "Express", "MongoDB", "PostgreSQL", "Docker", "Git", "REST APIs", "Jest"],
      activeVersionId: 2,
      activeVersionContent: {
        personalInfo: {
          name: "Alex Chen",
          email: "alex@careeros.dev",
          phone: "+1 (555) 234-5678",
          location: "San Francisco, CA",
          githubUrl: "github.com/alexchen-dev",
          linkedinUrl: "linkedin.com/in/alexchen-dev"
        },
        summary: "Senior Full Stack Engineer with 6+ years of experience designing scalable TypeScript web applications, REST microservices, and reactive user interfaces.",
        workExperience: [
          {
            company: "TechScale Solutions",
            position: "Senior Full Stack Developer",
            location: "San Francisco, CA",
            startDate: "2023",
            endDate: "Present",
            bulletPoints: [
              "Architected microservices in Node.js and Express handling 100k+ daily active requests.",
              "Engineered high-performance React 19 dashboards reducing LCP page load times by 45%.",
              "Automated CI/CD pipelines with Docker and GitHub Actions, cutting release cycles from 3 days to 20 minutes."
            ]
          }
        ],
        projects: [
          {
            title: "CareerOS Monorepo",
            technologies: ["Next.js", "React 19", "Express", "MongoDB", "TypeScript"],
            bulletPoints: ["Built full-stack AI career platform featuring ATS scanners and grounded AI coaching."],
            link: "https://github.com/alexchen-dev/careeros-monorepo"
          }
        ],
        skills: {
          languages: ["TypeScript", "JavaScript", "SQL", "Python"],
          frontend: ["React 19", "Next.js 16", "Tailwind CSS"],
          backend: ["Node.js", "Express.js", "REST APIs"],
          database: ["MongoDB", "PostgreSQL", "Redis"],
          tools: ["Docker", "Git", "Jest", "CI/CD"]
        },
        education: [
          { degree: "B.S. in Computer Science", institution: "University of California", graduationYear: "2020" }
        ]
      }
    },
    { upsert: true, new: true }
  );

  // 5. Job Opportunities Pipeline
  const demoJobs = [
    { title: "Senior Full Stack Engineer", company: "Vercel", status: "Interview", matchScore: 92, description: "Senior Engineer role leading Next.js and frontend infrastructure." },
    { title: "Staff Platform Engineer", company: "Stripe", status: "Applied", matchScore: 88, description: "Staff level platform position building global payment APIs." },
    { title: "Senior Frontend Architect", company: "Linear", status: "Saved", matchScore: 85, description: "Frontend Architect role scaling reactive web applications." }
  ];

  for (const job of demoJobs) {
    await JobOpportunity.findOneAndUpdate(
      { userId, title: job.title, company: job.company },
      {
        userId,
        title: job.title,
        company: job.company,
        url: `https://jobs.example.com/${job.company.toLowerCase()}`,
        status: job.status,
        description: job.description,
        skills: ["TypeScript", "Next.js", "Node.js", "Docker"]
      },
      { upsert: true, new: true }
    );
  }

  // 6. Interview Sessions
  await InterviewSession.findOneAndUpdate(
    { userId, role: "Senior Full Stack Developer", type: "Technical" },
    {
      userId,
      role: "Senior Full Stack Developer",
      type: "Technical",
      difficulty: "Advanced",
      status: "Completed",
      overallScore: 85,
      technicalScore: 88,
      communicationScore: 84,
      problemSolvingScore: 86,
      timeManagementScore: 82,
      feedbackSummary: "Excellent architectural understanding of Node.js async event loops and MongoDB indexing strategies."
    },
    { upsert: true, new: true }
  );

  // 7. Roadmap
  await Roadmap.findOneAndUpdate(
    { userId },
    {
      userId,
      goal: "Senior Full Stack Developer",
      tracks: [
        {
          id: "frontend-v1",
          title: "Advanced Next.js & React 19 Architectures",
          progress: 80,
          modules: [
            {
              title: "Server Components & Actions",
              subSkills: [
                { id: "fe-sub-1", title: "React Server Components", mastered: true, xpReward: 50 },
                { id: "fe-sub-2", title: "Form Actions & useActionState", mastered: true, xpReward: 50 },
                { id: "fe-sub-3", title: "Optimistic UI Updates", mastered: false, xpReward: 50 }
              ]
            }
          ]
        },
        {
          id: "backend-v1",
          title: "Microservices & Database Optimization",
          progress: 85,
          modules: [
            {
              title: "Express & Security Architecture",
              subSkills: [
                { id: "be-sub-1", title: "Modular Router Architecture", mastered: true, xpReward: 50 },
                { id: "be-sub-2", title: "Zod Schema Validation", mastered: true, xpReward: 50 },
                { id: "be-sub-3", title: "JWT & Bcrypt Security", mastered: true, xpReward: 50 }
              ]
            }
          ]
        }
      ]
    },
    { upsert: true, new: true }
  );

  // 8. Coach Message History
  const existingChat = await CoachMessage.findOne({ userId });
  if (!existingChat) {
    await CoachMessage.create({
      userId,
      sender: "coach",
      text: "Welcome back Alex! Based on your target goal of Senior Full Stack Developer, your resume ATS score is 88% and your developer health score is 88%. What would you like to work on today?",
      activePath: "/dashboard"
    });
  }

  // 9. Analytics Snapshot
  await AnalyticsSnapshot.create({
    userId,
    careerScore: 84,
    resumeScore: 88,
    developerScore: 88,
    projectScore: 88,
    roadmapScore: 82,
    interviewScore: 85,
    jobReadiness: 86,
    weeklyGrowth: 4,
    monthlyGrowth: 12
  });

  console.log("[Seeder] Official Demo Account provisioned cleanly!");
  process.exit(0);
}

seedDemoAccount().catch(err => {
  console.error("[Seeder] Error seeding demo account:", err);
  process.exit(1);
});
