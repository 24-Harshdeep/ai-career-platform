const mockDb = {
  user: {
    id: "user-id-harshdeep",
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
  profile: {
    targetRole: "Full Stack Developer",
    experienceLevel: "Intermediate",
    careerGoal: "Transition to Senior Full Stack Engineer role at Stripe/Vercel",
    currentPhase: "Foundation Building",
    strengths: ["Modern React (v19 hooks, server actions)", "TypeScript strict type checks"],
    weaknesses: ["Containerization (Docker configurations)", "AWS cloud deployments"],
    skillsPossessed: {
      technical: ["Data Structures", "Algorithms", "REST APIs"],
      soft: ["Communication", "Teamwork"],
      tools: ["Git"],
      frameworks: ["React", "Next.js", "Express"],
      languages: ["JavaScript", "TypeScript"],
      cloud: ["MongoDB Atlas"],
      devops: []
    },
    skillsTarget: {
      technical: ["Caching", "Database Indexing"],
      soft: ["Leadership"],
      tools: ["Docker"],
      frameworks: ["Tailwind CSS"],
      languages: ["SQL"],
      cloud: ["AWS"],
      devops: ["CI/CD Pipelines", "Dockerization"]
    },
    preferredLearningStyle: "Practical / Build-oriented",
    preferredJobType: "Full-Time Remote",
    targetCompanies: ["Stripe", "Vercel", "Linear"],
    isOnboardingComplete: true
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

module.exports = { mockDb };
