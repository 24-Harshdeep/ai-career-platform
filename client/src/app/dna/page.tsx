"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import {
  Dna,
  Target,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Search,
  SlidersHorizontal,
  Info,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import PoweredBy from "@/components/ui/PoweredBy";

// Segmented skill details array mapped with category, proficiency, simulated projects, and AI tip
const ALL_SKILLS_DETAILS = [
  {
    name: "React",
    category: "Languages & Frameworks",
    proficiency: "Expert",
    usedIn: 8,
    lastUsed: "Yesterday",
    description: "Component-based frontend library for declarative user interfaces.",
    tip: "Deepen understanding of React 19 Server Actions and concurrent features."
  },
  {
    name: "Next.js",
    category: "Languages & Frameworks",
    proficiency: "Expert",
    usedIn: 5,
    lastUsed: "2 days ago",
    description: "React framework for production-grade Server Component applications.",
    tip: "Study partial prereconciliation rendering and advanced middleware controls."
  },
  {
    name: "Tailwind CSS",
    category: "Languages & Frameworks",
    proficiency: "Advanced",
    usedIn: 10,
    lastUsed: "Yesterday",
    description: "Utility-first CSS styling system built for rapid UI compositions.",
    tip: "Use utility variables and custom theme transitions instead of inline overrides."
  },
  {
    name: "Node.js",
    category: "Languages & Frameworks",
    proficiency: "Intermediate",
    usedIn: 4,
    lastUsed: "3 days ago",
    description: "Event-driven, asynchronous server runtime environment.",
    tip: "Optimize asynchronous process flows and structure scalable cluster patterns."
  },
  {
    name: "SQL",
    category: "Databases",
    proficiency: "Intermediate",
    usedIn: 3,
    lastUsed: "5 days ago",
    description: "Declarative relational database query and manipulation language.",
    tip: "Audit query execution plans, indexes, and join algorithms."
  },
  {
    name: "Redis",
    category: "Databases",
    proficiency: "Beginner",
    usedIn: 1,
    lastUsed: "1 week ago",
    description: "In-memory key-value data structures used for fast caching systems.",
    tip: "Configure key TTL expiration limits and learn caching patterns."
  },
  {
    name: "Git",
    category: "Tools & Cloud",
    proficiency: "Advanced",
    usedIn: 12,
    lastUsed: "Yesterday",
    description: "Distributed version control system to manage commits and branches.",
    tip: "Learn interactive rebase operations and custom pre-commit hooks."
  },
  {
    name: "Testing",
    category: "Languages & Frameworks",
    proficiency: "Beginner",
    usedIn: 1,
    lastUsed: "2 weeks ago",
    description: "Unit, integration, and end-to-end testing frameworks.",
    tip: "Write assertions with Vitest, React Testing Library, or Playwright."
  },
  {
    name: "Docker",
    category: "Tools & Cloud",
    proficiency: "Beginner",
    usedIn: 0,
    lastUsed: "3 weeks ago",
    description: "Containerization tool for packaging isolated application binaries.",
    tip: "Construct multi-stage builds to optimize image footprints."
  },
  {
    name: "AWS",
    category: "Tools & Cloud",
    proficiency: "Beginner",
    usedIn: 1,
    lastUsed: "1 month ago",
    description: "Global cloud infrastructure and host compute services.",
    tip: "Analyze cloud security groups, Lambda instances, and S3 assets."
  }
];

export default function CareerDnaPage() {
  const storeUser = useCareerStore((state) => state.user);
  const profile = useCareerStore((state) => state.profile);
  const updateGoal = useCareerStore((state) => state.updateGoal);
  const updateExperience = useCareerStore((state) => state.updateExperience);
  const toggleSkill = useCareerStore((state) => state.toggleSkill);
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);
  const addNotification = useCareerStore((state) => state.addNotification);

  const [goalInput, setGoalInput] = useState(storeUser?.goal || "Full Stack Developer");
  const [experienceInput, setExperienceInput] = useState<any>(
    storeUser?.experience || "Intermediate"
  );
  const [saving, setSaving] = useState(false);

  // Search, filter, and sorting states for skills inventory
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Verified" | "Target" | "Frameworks" | "Databases" | "Tools">("All");
  const [sortOrder, setSortOrder] = useState<"name" | "proficiency" | "projects">("name");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  // Timer state for "Last analyzed"
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<Date>(new Date());
  const [lastAnalyzedText, setLastAnalyzedText] = useState("Just now");

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Synchronize state when storeUser data is asynchronously loaded from the database
  useEffect(() => {
    if (storeUser?.goal) {
      setGoalInput(storeUser.goal);
    }
    if (storeUser?.experience) {
      setExperienceInput(storeUser.experience);
    }
  }, [storeUser?.goal, storeUser?.experience]);

  // Live timer tick to format elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((new Date().getTime() - lastAnalyzedTime.getTime()) / 1000);
      if (seconds < 15) {
        setLastAnalyzedText("Just now");
      } else if (seconds < 60) {
        setLastAnalyzedText(`${seconds} seconds ago`);
      } else {
        const mins = Math.floor(seconds / 60);
        setLastAnalyzedText(`${mins} ${mins === 1 ? "minute" : "minutes"} ago`);
      }
    }, 10000); // refresh text every 10 seconds

    return () => clearInterval(interval);
  }, [lastAnalyzedTime]);

  const possessedSkills = useMemo(() => {
    return profile?.skillsPossessed
      ? [
          ...(profile.skillsPossessed.technical || []),
          ...(profile.skillsPossessed.soft || []),
          ...(profile.skillsPossessed.tools || []),
          ...(profile.skillsPossessed.frameworks || []),
          ...(profile.skillsPossessed.languages || []),
          ...(profile.skillsPossessed.cloud || []),
          ...(profile.skillsPossessed.devops || [])
        ]
      : [];
  }, [profile]);

  // Core Strengths list mapping
  const strengths = [
    { name: "React & Next.js", level: "Expert", progress: 95 },
    { name: "Tailwind CSS", level: "Advanced", progress: 90 },
    { name: "TypeScript", level: "Intermediate", progress: 75 },
    { name: "REST API Integration", level: "Intermediate", progress: 70 },
  ];

  // Opportunities / Weak Areas list mapping
  const weaknesses = [
    { name: "System Design", level: "Needs Improvement", progress: 30 },
    { name: "Unit & E2E Testing", level: "Needs Improvement", progress: 25 },
    { name: "AWS & Cloud Deployment", level: "Beginner", progress: 20 },
    { name: "Docker Containerization", level: "Beginner", progress: 15 },
  ];

  // Computed AI Metrics (derived from user profile and possessed skills)
  const goalClarity = useMemo(() => {
    return goalInput ? 88 : 0;
  }, [goalInput]);

  const skillMapping = useMemo(() => {
    if (possessedSkills.length === 0) return 0;
    return Math.min(100, Math.round((possessedSkills.length / 10) * 100));
  }, [possessedSkills]);

  const learningProfile = useMemo(() => {
    return profile?.isOnboardingComplete ? 95 : 50;
  }, [profile?.isOnboardingComplete]);

  const identityConfidence = useMemo(() => {
    const base = possessedSkills.length * 4; // up to 40%
    const expWeight = experienceInput ? 30 : 0; // 30%
    const goalWeight = goalInput ? 30 : 0; // 30%
    return Math.min(98, Math.round(base + expWeight + goalWeight));
  }, [possessedSkills, experienceInput, goalInput]);

  const aiConfidence = identityConfidence;

  const careerDnaScore = useMemo(() => {
    return Math.round((identityConfidence + goalClarity + skillMapping + learningProfile) / 4);
  }, [identityConfidence, goalClarity, skillMapping, learningProfile]);

  const goalProgress = useMemo(() => {
    return Math.min(95, Math.round((possessedSkills.length / 10) * 90));
  }, [possessedSkills]);

  // Derived Target Timeline parameters
  const estimatedMonths = 7;
  const estimatedCompletionDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + estimatedMonths);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  // Prepend title badge according to experience
  const targetRoleLabel = useMemo(() => {
    if (experienceInput === "Intermediate") return `Senior ${goalInput}`;
    if (experienceInput === "Advanced") return `Lead ${goalInput}`;
    return goalInput;
  }, [goalInput, experienceInput]);

  // Dynamic Career Persona mapping based on target role selection
  const personaArchetype = useMemo(() => {
    if (goalInput.toLowerCase().includes("full stack") || goalInput.toLowerCase().includes("frontend")) {
      return "The Builder";
    }
    if (goalInput.toLowerCase().includes("architect") || goalInput.toLowerCase().includes("devops")) {
      return "The Architect";
    }
    return "The Craftsperson";
  }, [goalInput]);

  const personaTraits = useMemo(() => {
    if (personaArchetype === "The Builder") {
      return ["Frontend Architectures", "API Integrations", "User Interactions", "Feature Scoping"];
    }
    if (personaArchetype === "The Architect") {
      return ["System Infrastructure", "DB Optimization", "Scale Strategies", "Reliability Pipelines"];
    }
    return ["Component Styling", "Clean Coding", "Rapid Iteration", "Unit Testing"];
  }, [personaArchetype]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600)); // Latency emulation
    await updateGoal(goalInput);
    await updateExperience(experienceInput);
    addNotification("Career DNA profile saved successfully!", "success");
    setLastAnalyzedTime(new Date());
    setSaving(false);
  };

  const handleToggleSkill = async (skillName: string, event: React.MouseEvent) => {
    // Avoid toggling when clicking the info button
    if ((event.target as HTMLElement).closest(".info-btn")) {
      return;
    }
    await toggleSkill(skillName);
    addNotification(`Skill inventory updated: toggled "${skillName}"`, "info");
    setLastAnalyzedTime(new Date());
  };

  // Filtered & Sorted skills calculations
  const processedSkillsList = useMemo(() => {
    let list = ALL_SKILLS_DETAILS.map(skill => ({
      ...skill,
      isPossessed: possessedSkills.includes(skill.name)
    }));

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }

    // Segment tab filter
    if (activeTab === "Verified") {
      list = list.filter(s => s.isPossessed);
    } else if (activeTab === "Target") {
      list = list.filter(s => !s.isPossessed);
    } else if (activeTab === "Frameworks") {
      list = list.filter(s => s.category === "Languages & Frameworks");
    } else if (activeTab === "Databases") {
      list = list.filter(s => s.category === "Databases");
    } else if (activeTab === "Tools") {
      list = list.filter(s => s.category === "Tools & Cloud");
    }

    // Sort ordering mapping
    list.sort((a, b) => {
      if (sortOrder === "proficiency") {
        const order: Record<string, number> = { Expert: 4, Advanced: 3, Intermediate: 2, Beginner: 1 };
        return (order[b.proficiency] || 0) - (order[a.proficiency] || 0);
      }
      if (sortOrder === "projects") {
        return b.usedIn - a.usedIn;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [searchQuery, activeTab, sortOrder, possessedSkills]);

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl relative">
            <Dna className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-background animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-foreground">Career DNA</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-success/10 text-success border border-success/20">
                <span className="w-1.5 h-1.5 mr-1 bg-success rounded-full animate-ping" />
                AI Engine: Live Sync Active
              </span>
            </div>
            <p className="text-xs text-muted max-w-2xl mt-1 leading-relaxed">
              This AI engine continuously understands your skills, career goals, strengths, weaknesses, and aspirations.
              Every recommendation in CareerOS starts here.
            </p>
          </div>
        </div>
        <PoweredBy engines={[
          {
            type: "user",
            label: "User Profile",
            description: "Direct input parameters detailing goals and experiences.",
            points: ["Target role & experience level selection", "Active skills competency inventory", "Target learning goals"]
          },
          {
            type: "engine",
            label: "Backend Intelligence",
            description: "Analytical calculation engines evaluating skill alignment.",
            points: ["Computes skill gaps", "Tracks career score metrics", "Calculates baseline readiness"]
          },
          {
            type: "ai",
            label: "AI Advice",
            description: "Generates custom insights to improve matching score coefficients.",
            points: ["Recommends next best skills to study", "Highlights target role matching opportunities"]
          }
        ]} />
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Identity & Target Role Form */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <UserCheck className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Identity & Target Role</h3>
            </div>

            <div className="space-y-4">
              {/* Target Goal Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase">Target Goal / Role</label>
                <select
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-full bg-accent/15 border border-border outline-none rounded-xl px-3 py-2.5 text-xs text-foreground cursor-pointer focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                >
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Backend Architect">Backend Architect</option>
                  <option value="Frontend Lead">Frontend Lead</option>
                  <option value="DevOps Specialist">DevOps Specialist</option>
                </select>
              </div>

              {/* Experience selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase">Experience Bracket</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setExperienceInput(level)}
                      className={`py-2 text-[11px] font-bold border rounded-xl cursor-pointer transition-colors duration-200 ${
                        experienceInput === level
                          ? "bg-primary text-white border-primary"
                          : "bg-accent/10 border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full text-xs font-semibold"
                  onClick={handleSaveProfile}
                  isLoading={saving}
                >
                  Save Profile Identity
                </Button>
              </div>
            </div>
          </Card>

          {/* AI Career Persona Card */}
          <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-card to-accent/5">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">AI Profile Persona</span>
                <h3 className="text-lg font-black text-foreground">{personaArchetype}</h3>
              </div>
              <Badge variant="primary">Archetype</Badge>
            </div>
            <p className="text-xs text-muted mb-4 leading-relaxed">
              Based on your skill profile and goal as a <span className="font-semibold text-foreground">{goalInput}</span>,
              the AI engine categorizes your developer persona style as a key driver of execution.
            </p>
            <div className="space-y-2 border-t border-border/40 pt-3">
              <span className="text-[10px] font-bold text-muted uppercase">Key Motivations & Work Styles</span>
              <div className="flex flex-wrap gap-1.5">
                {personaTraits.map((trait) => (
                  <Badge key={trait} variant="muted" className="text-[10px]">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Career DNA Score & AI Confidence */}
          <Card className="p-6 flex flex-col justify-between h-full relative overflow-hidden">
            <div>
              <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">AI Career Profile Status</h3>
                </div>
                <Badge variant="ai">AI Confidence {aiConfidence}%</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Circle Gauge */}
                <div className="md:col-span-4 flex flex-col items-center justify-center py-2">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-accent/20"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-primary transition-all duration-500 ease-out"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * careerDnaScore) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-foreground">{careerDnaScore}</span>
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider">DNA Score</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Bars */}
                <div className="md:col-span-8 space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-muted">Identity Confidence</span>
                      <span className="text-foreground">{identityConfidence}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${identityConfidence}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-muted">Goal Clarity</span>
                      <span className="text-foreground">{goalClarity}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${goalClarity}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-muted">Skill Mapping</span>
                      <span className="text-foreground">{skillMapping}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${skillMapping}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-muted">Learning Profile</span>
                      <span className="text-foreground">{learningProfile}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${learningProfile}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap justify-between text-[11px] text-muted font-medium">
              <div>
                Last analyzed: <span className="text-foreground font-semibold">{lastAnalyzedText}</span>
              </div>
              <div className="flex items-center">
                Next refresh:
                <span className="ml-1 text-foreground font-semibold inline-flex items-center">
                  <span className="w-1.5 h-1.5 mr-1 bg-primary rounded-full animate-ping" />
                  On profile change
                </span>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Timeline Section */}
      <div className="w-full">
        <Card className="p-6 flex flex-col justify-between h-full">
          <div className="w-full">
            <div className="flex items-center space-x-2 border-b border-border pb-3 mb-6">
              <Target className="w-5 h-5 text-secondary" />
              <h3 className="text-sm font-semibold text-foreground">Career Journey & Milestones</h3>
            </div>

            {/* Horizontal Progress Timeline */}
            <div className="relative py-6 px-4">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-8 right-8 h-1 bg-accent/30 -translate-y-1/2 z-0 rounded-full" />
              <div
                className="absolute top-1/2 left-8 h-1 bg-gradient-to-r from-primary to-secondary -translate-y-1/2 z-0 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(4, Math.min(92, goalProgress))}%` }}
              />

              <div className="grid grid-cols-4 relative z-10">
                {/* Node 1: Current Stage */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-white border-4 border-background flex items-center justify-center shadow-md font-bold text-xs">
                    1
                  </div>
                  <span className="text-[10px] font-bold text-muted uppercase mt-2">Current Stage</span>
                  <span className="text-xs font-semibold text-foreground mt-0.5">{experienceInput}</span>
                </div>

                {/* Node 2: Progress */}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-full border-4 border-background flex items-center justify-center shadow-md font-bold text-xs transition-colors duration-300 ${
                    goalProgress >= 25 ? "bg-primary text-white" : "bg-accent/40 text-muted"
                  }`}>
                    2
                  </div>
                  <span className="text-[10px] font-bold text-muted uppercase mt-2">Goal Progress</span>
                  <span className="text-xs font-semibold text-foreground mt-0.5">{goalProgress}%</span>
                </div>

                {/* Node 3: Target Role */}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-full border-4 border-background flex items-center justify-center shadow-md font-bold text-xs transition-colors duration-300 ${
                    goalProgress >= 75 ? "bg-secondary text-white" : "bg-accent/40 text-muted"
                  }`}>
                    3
                  </div>
                  <span className="text-[10px] font-bold text-muted uppercase mt-2">Target Role</span>
                  <span className="text-xs font-semibold text-foreground mt-0.5 max-w-[140px] truncate" title={targetRoleLabel}>
                    {targetRoleLabel}
                  </span>
                </div>

                {/* Node 4: Estimated Completion */}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-full border-4 border-background flex items-center justify-center shadow-md font-bold text-xs transition-colors duration-300 ${
                    goalProgress >= 90 ? "bg-success text-white" : "bg-accent/40 text-muted"
                  }`}>
                    4
                  </div>
                  <span className="text-[10px] font-bold text-muted uppercase mt-2">Target Time</span>
                  <span className="text-xs font-semibold text-foreground mt-0.5">{estimatedCompletionDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-accent/5 border border-border/50 rounded-xl p-3.5 flex justify-between items-center text-xs flex-col sm:flex-row gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span className="text-muted">Estimated effort remaining:</span>
              <span className="text-foreground font-bold">{estimatedMonths} Months</span>
            </div>
            <span className="text-primary font-bold">On Track to Target Role</span>
          </div>
        </Card>
      </div>

      {/* Row with AI advice and Strengths/Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI advice */}
        <div className="lg:col-span-5">
          <Card variant="insight" className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-primary/10 pb-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-xs text-primary font-bold uppercase tracking-wider">AI Skill Advice</span>
                </div>
                <Badge variant="ai">Live Recommendations</Badge>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed font-medium mb-4">
                Based on your target goal as a <span className="font-semibold text-foreground">{goalInput}</span>,
                acquiring <span className="font-semibold text-primary">Docker</span> skills next will address your largest gap.
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-2">
                <div className="text-[10px] font-bold text-primary uppercase">Why this skill?</div>
                <p className="text-xs text-muted leading-relaxed">
                  87% of job descriptions matching your target role expect Docker containerization knowledge for local development and CI/CD pipelines.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <div className="text-[10px] font-bold text-muted uppercase">Expected Career Impact</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-accent/10 border border-border/50 rounded-lg p-2.5 flex justify-between items-center">
                  <span className="text-muted">Job Readiness</span>
                  <span className="text-success font-bold">+4%</span>
                </div>
                <div className="bg-accent/10 border border-border/50 rounded-lg p-2.5 flex justify-between items-center">
                  <span className="text-muted">Resume Score</span>
                  <span className="text-success font-bold">+3 pts</span>
                </div>
                <div className="bg-accent/10 border border-border/50 rounded-lg p-2.5 flex justify-between items-center">
                  <span className="text-muted">Project Score</span>
                  <span className="text-success font-bold">+5 pts</span>
                </div>
                <div className="bg-accent/10 border border-border/50 rounded-lg p-2.5 flex justify-between items-center">
                  <span className="text-muted">Career Score</span>
                  <span className="text-primary font-bold">82 → 87</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Strengths & Weaknesses meters */}
        <div className="lg:col-span-7 space-y-6">
          {/* Strengths */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-success" />
              <h3 className="text-sm font-semibold text-foreground">Core Strengths</h3>
            </div>
            <div className="space-y-4">
              {strengths.map((s) => (
                <div key={s.name} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-foreground">{s.name}</span>
                    <Badge variant="success">{s.level}</Badge>
                  </div>
                  <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full"
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Weak Areas */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Opportunities / Weak Areas</h3>
            </div>
            <div className="space-y-4">
              {weaknesses.map((w) => (
                <div key={w.name} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-foreground">{w.name}</span>
                    <Badge variant="warning">{w.level}</Badge>
                  </div>
                  <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-warning rounded-full"
                      style={{ width: `${w.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

      {/* Interactive Skills Inventory Section */}
      <div className="w-full">
        <Card className="p-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4 mb-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Skills Profile Inventory</h3>
                <p className="text-xs text-muted mt-0.5">
                  Verify your active technical competencies. Toggling skills updates your Career DNA profile index.
                </p>
              </div>
            </div>
            <Badge variant="muted">{processedSkillsList.length} Skills Listed</Badge>
          </div>

          {/* Search, Filter, & Sort Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-accent/10 border border-border outline-none rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-muted" />
              <span className="text-[11px] font-bold text-muted uppercase">Sort by:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-accent/10 border border-border outline-none rounded-xl px-3 py-1.5 text-xs text-foreground cursor-pointer focus:border-primary/50"
              >
                <option value="name">Alphabetical</option>
                <option value="proficiency">Proficiency</option>
                <option value="projects">Project Usage</option>
              </select>
            </div>
          </div>

          {/* Segment Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-border/40 pb-4">
            {(["All", "Verified", "Target", "Frameworks", "Databases", "Tools"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-white"
                    : "bg-accent/10 border border-border/40 text-muted hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {processedSkillsList.map((skill) => {
              const isPossessed = skill.isPossessed;
              return (
                <div
                  key={skill.name}
                  onClick={(e) => handleToggleSkill(skill.name, e)}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isPossessed
                      ? "bg-primary/5 border-primary/30 hover:border-primary/60 shadow-[0_4px_12px_rgba(99,102,241,0.05)]"
                      : "bg-accent/5 border-border hover:border-primary/20 text-muted"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground flex items-center">
                        {skill.name}
                        {isPossessed ? (
                          <span className="ml-1.5 inline-flex items-center text-xs text-success font-semibold" title="Possessed">
                            ✓
                          </span>
                        ) : null}
                      </h4>
                      <span className="text-[10px] text-muted block mt-0.5">{skill.category}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        className="info-btn p-1 text-muted hover:text-foreground rounded-lg hover:bg-accent/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSkill(expandedSkill === skill.name ? null : skill.name);
                        }}
                        title="View details & AI study tips"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <Badge variant={isPossessed ? "success" : "warning"} className="text-[9px] px-1.5 py-0.5">
                        {isPossessed ? "Verified" : "Target"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center text-[10px] font-semibold text-muted border-t border-border/30 pt-2">
                    <div>Proficiency: <span className="text-foreground">{skill.proficiency}</span></div>
                    <div>Used in: <span className="text-foreground">{skill.usedIn} Projects</span></div>
                  </div>

                  {/* Expanded info block */}
                  {expandedSkill === skill.name && (
                    <div className="mt-3 pt-3 border-t border-border/40 text-[11px] text-muted space-y-2 animate-fade-in-up">
                      <p className="leading-relaxed">{skill.description}</p>
                      <div className="bg-primary/5 p-2 rounded-xl text-[10px]">
                        <span className="font-bold text-primary block mb-0.5">AI Tip</span>
                        {skill.tip}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {processedSkillsList.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-muted border border-dashed border-border rounded-2xl bg-accent/5">
                No matching skills found. Try adjusting your filter query.
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
