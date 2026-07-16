const express = require("express");
const router = express.Router();

const { calculateCareerScore } = require("../career-engine/careerScoreEngine");
const { computeNextBestAction } = require("../career-engine/nextBestActionEngine");
const { calculateReadiness } = require("../career-engine/readinessEngine");
const { generateTimeline } = require("../career-engine/timelineEngine");

// Localized Memory Cache Fallback (Used when MongoDB is disconnected)
const mockDb = {
  user: {
    name: "Harshdeep",
    email: "harshdeep@careeros.dev",
    role: "Full Stack Developer",
    goal: "Full Stack Developer",
    experience: "Intermediate",
    score: 82,
    scoreTrend: 4,
    hasResumeScanned: true,
    hasGithubScanned: false,
    projectsCount: 3,
    skillsCount: 7,
    masteredQuestionsCount: 1,
    streakDays: 7
  },
  roadmap: [
    {
      id: "rm-1",
      title: "Frontend Development",
      progress: 90,
      skills: ["React/Next.js", "Tailwind CSS", "TypeScript", "Performance Tuning"]
    },
    {
      id: "rm-2",
      title: "Backend Development",
      progress: 65,
      skills: ["Node.js/Express", "PostgreSQL", "JWT Authentication", "API Design"]
    },
    {
      id: "rm-3",
      title: "System Design",
      progress: 30,
      skills: ["Caching (Redis)", "Microservices", "Load Balancing", "DB Sharding"]
    }
  ],
  missions: [
    { id: "m-1", title: "Build API Authentication (Complete JWT Module)", completed: false, scoreReward: 3 },
    { id: "m-2", title: "Optimize database index queries", completed: false, scoreReward: 2 },
    { id: "m-3", title: "Complete resume upload audit", completed: true, scoreReward: 1 }
  ],
  applications: [
    { id: "app-1", company: "Vercel", role: "Frontend Engineer", matchScore: 92, status: "Applied", dateApplied: "2026-07-10" },
    { id: "app-2", company: "Stripe", role: "Full Stack Engineer", matchScore: 87, status: "Interview", dateApplied: "2026-07-08" },
    { id: "app-3", company: "Linear", role: "Product Engineer", matchScore: 79, status: "Offer", dateApplied: "2026-07-01" }
  ],
  notifications: [
    { id: "n-1", message: "7 Day Learning Streak! Keep building momentum.", type: "streak", read: false, createdAt: "2h ago" },
    { id: "n-2", message: "Resume successfully scanned! ATS Score: 82%", type: "success", read: true, createdAt: "1d ago" }
  ],
  chats: [
    { id: "msg-1", sender: "coach", text: "Welcome Harshdeep! I am your AI Career Coach. I analyzed your profile and GitHub activity. Your frontend skills are strong, but backend architecture is your highest priority right now.", timestamp: "10:00 AM" }
  ]
};

// Helper: Calculate statistics from mockDb
function getCalculatedStats() {
  const roadmapAvg = mockDb.roadmap.reduce((acc, m) => acc + m.progress, 0) / mockDb.roadmap.length;
  
  const scoreData = calculateCareerScore({
    hasResumeScanned: mockDb.user.hasResumeScanned,
    hasGithubScanned: mockDb.user.hasGithubScanned,
    projectsCount: mockDb.user.projectsCount,
    skillsCount: mockDb.user.skillsCount,
    roadmapAverageProgress: roadmapAvg,
    applicationsCount: mockDb.applications.length,
    masteredQuestionsCount: mockDb.user.masteredQuestionsCount,
    streakDays: mockDb.user.streakDays
  });

  const nextAction = computeNextBestAction({
    hasResumeScanned: mockDb.user.hasResumeScanned,
    hasGithubScanned: mockDb.user.hasGithubScanned,
    hasCompletedM1: mockDb.missions.find(m => m.id === "m-1").completed,
    hasCompletedM2: mockDb.missions.find(m => m.id === "m-2").completed,
    targetGoal: mockDb.user.goal
  });

  const readiness = calculateReadiness({
    careerScore: scoreData.score,
    hasResumeScanned: mockDb.user.hasResumeScanned,
    hasGithubScanned: mockDb.user.hasGithubScanned,
    projectsCount: mockDb.user.projectsCount,
    masteredQuestionsCount: mockDb.user.masteredQuestionsCount
  });

  const hasOffer = mockDb.applications.some(a => a.status === "Offer");
  const timeline = generateTimeline({
    hasResumeScanned: mockDb.user.hasResumeScanned,
    hasGithubScanned: mockDb.user.hasGithubScanned,
    roadmapAverageProgress: roadmapAvg,
    hasOfferSecured: hasOffer
  });

  mockDb.user.score = scoreData.score;

  return {
    score: scoreData.score,
    breakdown: scoreData.breakdown,
    nextAction,
    readiness,
    timeline
  };
}

// REST API endpoints

// 1. Auth & Profile
router.post("/auth/login", (req, res) => {
  res.json({ token: "mock-jwt-token", user: mockDb.user });
});

router.get("/user/profile", (req, res) => {
  res.json(mockDb.user);
});

router.put("/user/profile", (req, res) => {
  const { goal, experience } = req.body;
  if (goal) mockDb.user.goal = goal;
  if (experience) mockDb.user.experience = experience;
  res.json({ success: true, user: mockDb.user });
});

// 2. Career Engine Metrics
router.get("/career/stats", (req, res) => {
  res.json(getCalculatedStats());
});

// 3. Roadmap Track Checklists
router.get("/roadmap", (req, res) => {
  res.json(mockDb.roadmap);
});

router.put("/roadmap/progress", (req, res) => {
  const { moduleId, progress } = req.body;
  const module = mockDb.roadmap.find(m => m.id === moduleId);
  if (module) {
    module.progress = Math.min(100, Math.max(0, progress));
  }
  res.json({ success: true, roadmap: mockDb.roadmap, stats: getCalculatedStats() });
});

// 4. Missions Tracker
router.get("/missions", (req, res) => {
  res.json(mockDb.missions);
});

router.post("/missions/complete", (req, res) => {
  const { id } = req.body;
  const mission = mockDb.missions.find(m => m.id === id);
  if (mission && !mission.completed) {
    mission.completed = true;
    
    // Trigger notification
    mockDb.notifications.unshift({
      id: `n-${Date.now()}`,
      message: `Completed mission: ${mission.title}`,
      type: "success",
      read: false,
      createdAt: "Just now"
    });
  }
  res.json({ success: true, missions: mockDb.missions, stats: getCalculatedStats() });
});

// 5. Job Applications Pipeline
router.get("/applications", (req, res) => {
  res.json(mockDb.applications);
});

router.post("/applications", (req, res) => {
  const { company, role, matchScore } = req.body;
  const newApp = {
    id: `app-${Date.now()}`,
    company,
    role,
    matchScore: Number(matchScore) || 85,
    status: "Applied",
    dateApplied: new Date().toISOString().split("T")[0]
  };
  mockDb.applications.unshift(newApp);
  res.json({ success: true, applications: mockDb.applications, stats: getCalculatedStats() });
});

router.put("/applications/status", (req, res) => {
  const { id, status } = req.body;
  const app = mockDb.applications.find(a => a.id === id);
  if (app) {
    app.status = status;
  }
  res.json({ success: true, applications: mockDb.applications, stats: getCalculatedStats() });
});

// 6. Notifications
router.get("/notifications", (req, res) => {
  res.json(mockDb.notifications);
});

// 7. AI Career Coach Messaging
router.get("/coach/history", (req, res) => {
  res.json(mockDb.chats);
});

router.post("/coach/message", (req, res) => {
  const { text } = req.body;
  
  const userMsg = {
    id: `msg-${Date.now()}`,
    sender: "user",
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
  mockDb.chats.push(userMsg);

  // Simple Specialist replies
  let coachReply = "I am reviewing your profile inputs. Focus on resolving the Next Best Action on your dashboard to increase your score.";
  
  const query = text.toLowerCase();
  if (query.includes("resume") || query.includes("ats")) {
    coachReply = "To optimize your resume, perform an ATS scan under 'Resume Intelligence'. Our engine will report missing keywords like Docker and CI/CD.";
  } else if (query.includes("github") || query.includes("portfolio")) {
    coachReply = "Your Github quality index is intermediate. Link your repositories in 'Portfolio Intelligence' to index document completeness.";
  } else if (query.includes("interview") || query.includes("practice")) {
    coachReply = "Let's practice! Go to 'Interview Prep' and master our PostgreSQL indexing and JWT authentication deck.";
  }

  const coachMsg = {
    id: `msg-${Date.now() + 1}`,
    sender: "coach",
    text: coachReply,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
  
  setTimeout(() => {
    mockDb.chats.push(coachMsg);
  }, 100);

  res.json({ success: true, chats: mockDb.chats });
});

module.exports = router;
