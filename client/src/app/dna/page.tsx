"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Dna,
  Target,
  ShieldCheck,
  UserCheck,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  LineChart,
  Activity,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Zap,
  Flame,
  Award,
  Clock,
  CheckCircle,
  Sparkles,
  FileText,
  GraduationCap,
  ArrowRight,
  Brain,
  FolderGit,
  Layers,
  ArrowDown
} from "lucide-react";

function CareerDnaContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "analytics" ? "analytics" : "dna";

  const storeUser = useCareerStore((state) => state.user);
  const profile = useCareerStore((state) => state.profile);
  const stats = useCareerStore((state) => state.stats);
  const analyticsData = useCareerStore((state) => state.analyticsData);
  const resumeAnalysis = useCareerStore((state) => state.resumeAnalysis);
  const developerProfile = useCareerStore((state) => state.developerProfile);

  const updateGoal = useCareerStore((state) => state.updateGoal);
  const updateExperience = useCareerStore((state) => state.updateExperience);
  const toggleSkill = useCareerStore((state) => state.toggleSkill);
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);
  const fetchAnalyticsDashboard = useCareerStore((state) => state.fetchAnalyticsDashboard);
  const fetchResumeAnalysis = useCareerStore((state) => state.fetchResumeAnalysis);
  const fetchDeveloperProfile = useCareerStore((state) => state.fetchDeveloperProfile);
  const addNotification = useCareerStore((state) => state.addNotification);

  const [mainTab, setMainTab] = useState<"dna" | "analytics">(initialTab);

  const [goalInput, setGoalInput] = useState(storeUser?.goal || profile?.targetRole || "Full Stack Developer");
  const [experienceInput, setExperienceInput] = useState<any>(
    storeUser?.experience || profile?.experienceLevel || "Intermediate"
  );
  const [saving, setSaving] = useState(false);

  // Search, filter, and sorting states for skills inventory
  const [searchQuery, setSearchQuery] = useState("");
  const [newSkillInput, setNewSkillInput] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Verified">("All");
  const [sortOrder, setSortOrder] = useState<"name" | "category">("name");

  const handleAddCustomSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    const skillName = newSkillInput.trim();
    await toggleSkill(skillName);
    addNotification(`Added "${skillName}" to your real skills inventory!`, "success");
    setNewSkillInput("");
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAnalyticsDashboard();
    fetchResumeAnalysis();
    fetchDeveloperProfile();
  }, [fetchDashboardData, fetchAnalyticsDashboard, fetchResumeAnalysis, fetchDeveloperProfile]);

  // Synchronize tab if URL param changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "analytics") {
      setMainTab("analytics");
    }
  }, [searchParams]);

  // Synchronize state when storeUser data is loaded from API
  useEffect(() => {
    if (storeUser?.goal || profile?.targetRole) {
      setGoalInput(storeUser.goal || profile?.targetRole || "Full Stack Developer");
    }
    if (storeUser?.experience || profile?.experienceLevel) {
      setExperienceInput(storeUser.experience || profile?.experienceLevel || "Intermediate");
    }
  }, [storeUser?.goal, storeUser?.experience, profile?.targetRole, profile?.experienceLevel]);

  // Aggregate possessed skills from profile
  const possessedSkills = useMemo(() => {
    if (!profile?.skillsPossessed) return [];
    
    const skills: { name: string; category: string }[] = [];
    for (const [category, skillList] of Object.entries(profile.skillsPossessed)) {
      if (Array.isArray(skillList)) {
        skillList.forEach(name => skills.push({ name, category }));
      }
    }
    return skills;
  }, [profile]);

  // Verified evidence skills extracted from Resume and GitHub
  const verifiedSkillsSet = useMemo(() => {
    const set = new Set<string>();
    if (resumeAnalysis?.activeVersionContent?.skills) {
      const s = resumeAnalysis.activeVersionContent.skills;
      [...(s.languages || []), ...(s.frontend || []), ...(s.backend || []), ...(s.database || []), ...(s.tools || []), ...(s.other || [])].forEach(sk => set.add(sk.toLowerCase()));
    }
    if (developerProfile?.languageDistribution) {
      Object.keys(developerProfile.languageDistribution).forEach(lang => set.add(lang.toLowerCase()));
    }
    return set;
  }, [resumeAnalysis, developerProfile]);
  
  // Combine possessed and evidence skills from profile, resume, and GitHub
  const allSkillsList = useMemo(() => {
    const list: { name: string; category: string; source: string }[] = [];
    const addedNames = new Set<string>();

    // 1. User Possessed / Saved Skills from CareerProfile (MongoDB)
    if (profile?.skillsPossessed) {
      for (const [category, skillList] of Object.entries(profile.skillsPossessed)) {
        if (Array.isArray(skillList)) {
          skillList.forEach((name) => {
            const lower = name.toLowerCase();
            if (!addedNames.has(lower)) {
              addedNames.add(lower);
              list.push({ name, category, source: "Profile" });
            }
          });
        }
      }
    }

    // 2. Resume Parsed & Verified Skills
    if (resumeAnalysis?.activeVersionContent?.skills) {
      const s = resumeAnalysis.activeVersionContent.skills;
      const categories: (keyof typeof s)[] = ["languages", "frontend", "backend", "database", "tools", "other"];
      categories.forEach((cat) => {
        if (Array.isArray(s[cat])) {
          s[cat].forEach((name: string) => {
            const lower = name.toLowerCase();
            if (!addedNames.has(lower)) {
              addedNames.add(lower);
              list.push({ name, category: cat === "other" ? "general" : cat, source: "Resume" });
            }
          });
        }
      });
    }

    // 3. GitHub Verified Languages
    if (developerProfile?.languageDistribution) {
      Object.keys(developerProfile.languageDistribution).forEach((lang) => {
        const lower = lang.toLowerCase();
        if (!addedNames.has(lower)) {
          addedNames.add(lower);
          list.push({ name: lang, category: "languages", source: "GitHub" });
        }
      });
    }

    return list;
  }, [profile, resumeAnalysis, developerProfile]);

  // Handle Save Profile
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateGoal(goalInput);
      await updateExperience(experienceInput);
      addNotification("Career Direction updated. CareerContext recalculated.", "success");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSkill = async (skillName: string, category: string) => {
    await toggleSkill(skillName);
    addNotification(`Skills inventory updated: toggled "${skillName}"`, "info");
  };

  // Filtered & Sorted skills calculations
  const processedSkillsList = useMemo(() => {
    let list = allSkillsList.map(skill => {
      const isPossessed = possessedSkills.some(ps => ps.name.toLowerCase() === skill.name.toLowerCase());
      const isVerified = verifiedSkillsSet.has(skill.name.toLowerCase());
      return {
        ...skill,
        isPossessed,
        isVerified
      };
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }

    if (activeTab === "Verified") {
      list = list.filter(s => s.isVerified);
    }

    list.sort((a, b) => {
      if (sortOrder === "category") {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [allSkillsList, possessedSkills, verifiedSkillsSet, searchQuery, activeTab, sortOrder]);

  const overallScore = stats?.score ?? analyticsData?.careerScore ?? storeUser?.score ?? 0;
  const readiness = stats?.readiness || analyticsData;

  // Fallback default next action if stats.nextAction is null or incomplete
  const defaultNextAction = {
    actionId: "action-resume-upload",
    title: "Upload & Audit Resume",
    description: "Scan your resume to obtain your ATS score and unlock personalized recommendations.",
    reason: "Missing primary resume evidence to calculate market readiness.",
    type: "resume",
    targetUrl: "/resume",
  };

  const rawNextAction = stats?.nextAction;
  const activeNextAction = (rawNextAction && (rawNextAction.title || rawNextAction.actionId || rawNextAction.type))
    ? {
        ...rawNextAction,
        title: rawNextAction.title || "Execute Recommended Action",
        reason: rawNextAction.reason || rawNextAction.description || "High-priority career optimization item based on your active context.",
      }
    : defaultNextAction;

  // Resolve target URL for Next Best Action
  const getNextActionUrl = (action: any) => {
    if (!action) return "/resume";
    if (action.targetUrl && action.targetUrl !== "/dna") return action.targetUrl;

    const type = (action.type || "").toLowerCase();
    const title = (action.title || "").toLowerCase();
    const actionId = (action.actionId || "").toLowerCase();
    const reason = (action.reason || "").toLowerCase();

    if (type === "resume" || title.includes("resume") || actionId.includes("resume") || reason.includes("resume")) return "/resume";
    if (type === "github" || type === "project" || type === "portfolio" || title.includes("github") || title.includes("portfolio") || title.includes("project") || actionId.includes("github") || actionId.includes("portfolio") || actionId.includes("project")) return "/portfolio";
    if (type === "interview" || title.includes("interview") || actionId.includes("interview") || reason.includes("interview")) return "/interview";
    if (type === "roadmap" || type === "learning" || title.includes("roadmap") || title.includes("module") || title.includes("skill") || actionId.includes("roadmap") || actionId.includes("learning")) return "/roadmap";
    if (type === "application" || type === "applications" || title.includes("application") || title.includes("job") || actionId.includes("application") || actionId.includes("job")) return "/applications";

    return "/resume";
  };

  // Real strengths derived from profile + GitHub developer profile + resume
  const realStrengths = useMemo(() => {
    const list: string[] = [];
    if (profile?.strengths && profile.strengths.length > 0) {
      profile.strengths.forEach(s => list.push(s));
    }
    if (developerProfile?.strengths && developerProfile.strengths.length > 0) {
      developerProfile.strengths.forEach(s => {
        if (!list.includes(s)) list.push(s);
      });
    }
    if (resumeAnalysis?.atsScore && resumeAnalysis.atsScore >= 75) {
      list.push(`Strong ATS Resume Alignment (${resumeAnalysis.atsScore}%)`);
    }
    if (developerProfile?.overallHealth && developerProfile.overallHealth >= 80) {
      list.push(`Production-Grade Engineering Health (${developerProfile.overallHealth}%)`);
    }
    return list;
  }, [profile, developerProfile, resumeAnalysis]);

  // Real growth areas derived from profile + GitHub missing practices + resume missing keywords
  const realGrowthAreas = useMemo(() => {
    const list: string[] = [];
    if (profile?.weaknesses && profile.weaknesses.length > 0) {
      profile.weaknesses.forEach(w => list.push(w));
    }
    if (resumeAnalysis?.missingKeywords && resumeAnalysis.missingKeywords.length > 0) {
      const topKeywords = resumeAnalysis.missingKeywords.slice(0, 3).map(k => typeof k === "string" ? k : k.keyword);
      list.push(`Missing ATS Keywords: ${topKeywords.join(", ")}`);
    }
    if (developerProfile?.missingPractices && developerProfile.missingPractices.length > 0) {
      const practices = developerProfile.missingPractices.slice(0, 2);
      list.push(`Repository Practices: ${practices.join("; ")}`);
    }
    return list;
  }, [profile, resumeAnalysis, developerProfile]);

  // Executive Analytics Calculations
  const healthMetrics = useMemo(() => {
    return [
      { name: "Resume ATS", score: analyticsData?.resumeScore ?? stats?.breakdown?.resume ?? 0, status: (analyticsData?.resumeScore ?? stats?.breakdown?.resume ?? 0) >= 80 ? "Green" : (analyticsData?.resumeScore ?? stats?.breakdown?.resume ?? 0) >= 70 ? "Yellow" : "Red" },
      { name: "GitHub Health", score: analyticsData?.developerScore ?? stats?.breakdown?.github ?? 0, status: (analyticsData?.developerScore ?? stats?.breakdown?.github ?? 0) >= 80 ? "Green" : (analyticsData?.developerScore ?? stats?.breakdown?.github ?? 0) >= 70 ? "Yellow" : "Red" },
      { name: "Live Projects", score: analyticsData?.projectScore ?? stats?.breakdown?.projects ?? 0, status: (analyticsData?.projectScore ?? stats?.breakdown?.projects ?? 0) >= 80 ? "Green" : (analyticsData?.projectScore ?? stats?.breakdown?.projects ?? 0) >= 70 ? "Yellow" : "Red" },
      { name: "Interview Readiness", score: analyticsData?.interviewScore ?? stats?.breakdown?.interview ?? 0, status: (analyticsData?.interviewScore ?? stats?.breakdown?.interview ?? 0) >= 80 ? "Green" : (analyticsData?.interviewScore ?? stats?.breakdown?.interview ?? 0) >= 70 ? "Yellow" : "Red" },
      { name: "Roadmap Mastery", score: analyticsData?.roadmapScore ?? stats?.breakdown?.learning ?? 0, status: (analyticsData?.roadmapScore ?? stats?.breakdown?.learning ?? 0) >= 80 ? "Green" : (analyticsData?.roadmapScore ?? stats?.breakdown?.learning ?? 0) >= 50 ? "Yellow" : "Red" },
      { name: "Consistency Streak", score: (analyticsData?.streakDays ?? 0) >= 5 ? 90 : (analyticsData?.streakDays ?? 0) >= 3 ? 70 : 40, status: (analyticsData?.streakDays ?? 0) >= 5 ? "Green" : (analyticsData?.streakDays ?? 0) >= 3 ? "Yellow" : "Red" },
    ];
  }, [analyticsData, stats]);

  const benchmarkStatus = useMemo(() => {
    const score = overallScore;
    if (score == null || score === 0) return { label: "Junior Level", diff: 60, next: "Junior Tier (60 pts)" };
    if (score >= 90) return { label: "Top 10% Senior Developer", diff: score - 90, next: "Elite Tier" };
    if (score >= 75) return { label: "Intermediate Developer", diff: 90 - score, next: "Top 10% (90 pts)" };
    return { label: "Junior Developer", diff: 75 - score, next: "Intermediate (75 pts)" };
  }, [overallScore]);

  const predictiveForecastList = useMemo(() => {
    const current = overallScore;
    return [
      { step: "Current Baseline", score: current, icon: Zap, active: true },
      { step: "After ATS Resume Optimization", score: Math.min(99, current + 4), icon: CheckCircle, active: false },
      { step: "After Docker & CI/CD Project Audit", score: Math.min(99, current + 7), icon: Award, active: false },
      { step: "After GitHub Repository Evidence Sync", score: Math.min(99, current + 11), icon: TrendingUp, active: false },
      { step: "Target Placement Readiness", score: Math.min(99, current + 15), icon: Sparkles, active: false }
    ];
  }, [overallScore]);

  // Heatmap & Radar formatting
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const consistencyData = (analyticsData?.heatMapDays || [0, 0, 0, 0, 0, 0, 0]).map((val, idx) => ({
    day: daysOfWeek[idx] || "Day",
    checkins: val
  }));

  const radarData = useMemo(() => {
    if (analyticsData?.skillsDistribution && analyticsData.skillsDistribution.length > 0) {
      return analyticsData.skillsDistribution.map(s => ({ skill: s.category, val: s.rating }));
    }
    if (possessedSkills.length > 0) {
      const catCount: Record<string, number> = {};
      possessedSkills.forEach(s => {
        catCount[s.category] = (catCount[s.category] || 0) + 1;
      });
      return Object.entries(catCount).map(([category, count]) => ({
        skill: category.toUpperCase(),
        val: Math.min(100, count * 25)
      }));
    }
    return [];
  }, [analyticsData, possessedSkills]);

  const hasRadarData = radarData.length > 0 && radarData.some(s => s.val > 0);

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <StaggerItem>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader 
            icon={Dna} 
            title="Career DNA" 
            description="Your professional identity, skills inventory, and current career state. CareerOS uses this information to personalize your career intelligence."
          >
            <div className="flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Synced with CareerContext</span>
            </div>
          </PageHeader>

          {/* Navigation Tab Switcher */}
          <div className="flex bg-accent border border-border p-1 rounded-xl shrink-0 self-start md:self-auto">
            <button
              onClick={() => setMainTab("dna")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                mainTab === "dna"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>Identity & Skills</span>
            </button>
            <button
              onClick={() => setMainTab("analytics")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                mainTab === "analytics"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Career Analytics</span>
            </button>
          </div>
        </div>
      </StaggerItem>

      {mainTab === "analytics" ? (
        <div className="space-y-6 animate-fade-in">
          {/* Goal Progress & Market Diagnostics Health Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Goal Alignment & Market Positioning */}
            <Card className="lg:col-span-5 p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
                <Target className="w-4.5 h-4.5 text-primary shrink-0" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Goal Alignment & Benchmarks</h3>
              </div>

              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted font-bold uppercase text-[9px]">Target Track</span>
                  <span className="font-bold text-foreground bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg border border-primary/20">{goalInput || profile?.targetRole || "Full Stack Developer"}</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Roadmap Mastery</span>
                    <span className="font-bold text-foreground">{analyticsData?.roadmapScore || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${analyticsData?.roadmapScore || 0}%` }} />
                  </div>
                </div>

                {/* Benchmark Indicator Cards */}
                <div className="space-y-2.5 pt-2.5 border-t border-border/40 text-xs">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Market Positioning Benchmarks</span>
                  
                  <div className="relative pt-3 pb-1">
                    <div className="h-2.5 w-full bg-accent/20 rounded-full z-0 relative flex overflow-hidden">
                      <div className="h-full bg-warning/30 border-r border-background" style={{ width: "60%" }} />
                      <div className="h-full bg-info/30 border-r border-background" style={{ width: "15%" }} />
                      <div className="h-full bg-success/30" style={{ width: "25%" }} />
                    </div>
                    
                    <div 
                      className="absolute top-1 w-3.5 h-3.5 bg-primary border-2 border-card rounded-full z-20 shadow-md transition-all duration-300"
                      style={{ left: `${Math.min(95, Math.max(5, overallScore))}%` }}
                    />

                    <div className="flex justify-between text-[9px] text-muted pt-1 font-semibold">
                      <span>Junior (60)</span>
                      <span>Mid (75)</span>
                      <span>Top 10% (90+)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-card border border-border p-2.5 rounded-xl space-y-0.5">
                      <span className="text-[9px] text-muted font-bold uppercase block">Current Score</span>
                      <span className="text-sm font-extrabold text-foreground">{overallScore} / 100</span>
                    </div>
                    <div className="bg-card border border-border p-2.5 rounded-xl space-y-0.5">
                      <span className="text-[9px] text-muted font-bold uppercase block">Current Tier</span>
                      <span className="text-sm font-extrabold text-primary">{benchmarkStatus.label}</span>
                    </div>
                    <div className="bg-card border border-border p-2.5 rounded-xl space-y-0.5">
                      <span className="text-[9px] text-muted font-bold uppercase block">Next Benchmark</span>
                      <span className="text-sm font-extrabold text-foreground">{benchmarkStatus.next}</span>
                    </div>
                    <div className="bg-card border border-border p-2.5 rounded-xl space-y-0.5">
                      <span className="text-[9px] text-muted font-bold uppercase block">Points Needed</span>
                      <span className="text-sm font-extrabold text-warning">{benchmarkStatus.diff ? `${benchmarkStatus.diff} pts remaining` : "Achieved"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Diagnostic Health Grid */}
            <Card className="lg:col-span-7 p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
                <Activity className="w-4.5 h-4.5 text-secondary shrink-0" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Career Health Vectors</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                {healthMetrics.map((metric) => (
                  <div key={metric.name} className="p-3 bg-accent/10 border border-border rounded-2xl space-y-2.5 flex flex-col justify-between hover:bg-accent/15 transition-all">
                    <div>
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">{metric.name}</span>
                      <span className="text-lg font-black text-foreground mt-0.5 block">{metric.score}%</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[9px] font-bold">
                      {metric.status === "Green" ? (
                        <span className="inline-flex items-center text-success gap-1">
                          <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> Healthy
                        </span>
                      ) : metric.status === "Yellow" ? (
                        <span className="inline-flex items-center text-warning gap-1">
                          <span className="w-2 h-2 rounded-full bg-warning" /> Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-danger gap-1">
                          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" /> Critical
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Grid: Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Growth Curve Chart */}
            <div className="lg:col-span-8">
              <Card className="p-6 h-full flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-muted">Career Score Progression</h3>
                    <p className="text-xl font-bold text-foreground mt-1">Growth Velocity Curve</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-foreground">{overallScore}</span>
                    {analyticsData?.weeklyGrowth != null && (
                      <p className="text-[10px] text-success font-bold flex items-center justify-end mt-0.5">
                        <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                        <span>+{analyticsData.weeklyGrowth} points (7d)</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-60 w-full flex items-center justify-center bg-accent/5 rounded-2xl border border-border p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { week: "W1", score: Math.max(10, overallScore - 15) },
                      { week: "W2", score: Math.max(15, overallScore - 10) },
                      { week: "W3", score: Math.max(20, overallScore - 5) },
                      { week: "W4", score: overallScore }
                    ]} margin={{ left: -25, right: 10 }}>
                      <defs>
                        <linearGradient id="colorScoreGradDna" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="week" stroke="var(--muted)" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="var(--muted)" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          color: "var(--foreground)",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorScoreGradDna)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Skill Radar Proficiency */}
            <div className="lg:col-span-4">
              <Card className="p-6 h-full flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted">Skills Matrix Distribution</h3>
                  <p className="text-sm font-bold text-foreground mt-1">Strengths Balance Radar</p>
                </div>

                {hasRadarData ? (
                  <>
                    <div className="h-60 w-full flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="var(--border)" />
                          <PolarAngleAxis dataKey="skill" stroke="var(--muted)" fontSize={10} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke="var(--border)" />
                          <Radar
                            name="Skills Rating"
                            dataKey="val"
                            stroke="var(--secondary)"
                            fill="var(--secondary)"
                            fillOpacity={0.25}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Proficiency Progress Bars */}
                    <div className="space-y-2 mt-2 pt-2 border-t border-border/40">
                      {radarData.slice(0, 4).map((s) => (
                        <div key={s.skill} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold text-foreground">{s.skill}</span>
                            <span className="text-muted font-bold">{s.val}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                            <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${s.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-60 w-full flex flex-col items-center justify-center border border-dashed border-border rounded-2xl p-6 text-center space-y-2 bg-accent/5 my-auto">
                    <BarChart3 className="w-8 h-8 text-muted opacity-50" />
                    <h4 className="text-xs font-bold text-foreground">Not enough skill evidence yet</h4>
                    <p className="text-[11px] text-muted max-w-xs">
                      Add skills in your Skills Inventory, upload a resume, or connect GitHub to generate your strengths balance radar.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Grid: Consistency and Forecasts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Consistency Checkins */}
            <div className="lg:col-span-6">
              <Card className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Consistency Check-ins</h3>
                    <p className="text-xs text-muted mt-0.5">Activity log frequency across the last 7 days</p>
                  </div>
                  <Badge variant="info">Daily Log</Badge>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={consistencyData} margin={{ left: -25 }}>
                      <XAxis dataKey="day" stroke="var(--muted)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          color: "var(--foreground)",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="checkins" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Right: AI Forecast & Weekly Digest */}
            <div className="lg:col-span-6 space-y-6">
              {analyticsData?.weeklyReport && (
                <Card className="p-6 space-y-4 border-primary/20 bg-accent/5">
                  <div className="flex items-center space-x-2 border-b border-primary/10 pb-2">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">AI Weekly Digest</h3>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed font-semibold">
                    {analyticsData.weeklyReport.summary}
                  </p>
                </Card>
              )}

              {/* Predictive Forecast */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
                  <Zap className="w-4 h-4 text-warning fill-warning" />
                  <span className="text-xs text-foreground font-bold uppercase tracking-wider">Predictive Career Forecast</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2.5 relative before:absolute before:bottom-2 before:top-2 before:left-[11px] before:w-[1.5px] before:bg-border/60">
                    {predictiveForecastList.map((item, idx) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={idx} className="flex items-center space-x-3 text-xs relative pl-1">
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 z-10 ${
                            item.active 
                              ? "bg-primary text-white border-primary" 
                              : "bg-card text-muted border-border/80"
                          }`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <span className={`font-semibold ${item.active ? "text-foreground font-bold" : "text-muted"}`}>{item.step}</span>
                            <Badge variant={item.active ? "primary" : "muted"} className="font-bold text-[10px]">
                              Score {item.score}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 2. Top Row Grid: Career Direction & Career Intelligence Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Card: Career Direction */}
            <div className="lg:col-span-5">
              <StaggerItem>
                <Card className="p-6 h-full flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex items-center space-x-2 border-b border-border pb-3 mb-4">
                      <UserCheck className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Career Direction</h3>
                        <p className="text-[10px] text-muted">User-controlled target role and experience parameters</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted uppercase tracking-wide">Target Role</label>
                        <input
                          type="text"
                          value={goalInput}
                          onChange={(e) => setGoalInput(e.target.value)}
                          placeholder="e.g. Full Stack Developer"
                          className="w-full bg-accent border border-border outline-none rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-primary/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted uppercase tracking-wide">Experience Level</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setExperienceInput(level)}
                              className={`py-2 text-[10px] font-bold border rounded-xl transition-colors cursor-pointer ${
                                experienceInput === level
                                  ? "bg-primary text-white border-primary shadow-sm"
                                  : "bg-card border-border text-muted hover:text-foreground hover:bg-accent"
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full mt-2 cursor-pointer font-bold text-xs py-2.5"
                    onClick={handleSaveProfile}
                    isLoading={saving}
                  >
                    Save Career Direction
                  </Button>
                </Card>
              </StaggerItem>
            </div>

            {/* Right Card: Career Intelligence Snapshot */}
            <div className="lg:col-span-7">
              <StaggerItem>
                <Card className="p-6 h-full flex flex-col justify-between space-y-4 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Career Intelligence Snapshot</h3>
                        <p className="text-[10px] text-muted">Evaluated live by CareerOS intelligence engine from CareerContext</p>
                      </div>
                    </div>
                    <Badge variant="info">Live Intelligence</Badge>
                  </div>

                  {/* Telemetry Metrics Row */}
                  <div className="grid grid-cols-3 gap-3 bg-accent/10 p-3.5 rounded-2xl border border-border/60">
                    <div>
                      <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">Career Score</span>
                      <span className="text-xl font-extrabold text-foreground mt-0.5 block">{overallScore} / 100</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">Market Readiness</span>
                      <span className="text-xl font-extrabold text-primary mt-0.5 block">
                        {readiness?.jobReadiness != null ? `${readiness.jobReadiness}%` : "Evaluating"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">Skill Gaps</span>
                      <span className="text-xl font-extrabold text-warning mt-0.5 block">
                        {realGrowthAreas.length} Identified
                      </span>
                    </div>
                  </div>

                  {/* Next Best Action Highlight */}
                  <div className="p-3.5 bg-card border border-primary/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-primary uppercase tracking-wider block">Recommended Next Best Action</span>
                      <h4 className="text-xs font-bold text-foreground truncate">{activeNextAction.title}</h4>
                      <p className="text-[10px] text-muted line-clamp-1">{activeNextAction.reason || activeNextAction.description}</p>
                    </div>
                    <Link href={getNextActionUrl(activeNextAction)}>
                      <Button variant="ai" size="sm" className="shrink-0 text-xs font-bold cursor-pointer">
                        <span>Execute Action</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </StaggerItem>
            </div>
          </div>

          {/* 3. Visual Architecture Bridge: How CareerOS Uses Your Career DNA */}
          <StaggerItem>
            <Card className="p-5 bg-accent/20 border-border/80 space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">How CareerOS Uses Your Career DNA</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 bg-card border border-border rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase block">1. Your Profile State</span>
                  <p className="text-[11px] text-foreground font-semibold">Career Goal + Skills Inventory</p>
                </div>
                <div className="p-3 bg-card border border-border rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-secondary uppercase block">2. Verified Evidence</span>
                  <p className="text-[11px] text-foreground font-semibold">Resume, GitHub & Projects</p>
                </div>
                <div className="p-3 bg-card border border-border rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-warning uppercase block">3. CareerContext</span>
                  <p className="text-[11px] text-foreground font-semibold">Unified Single Source of Truth</p>
                </div>
                <div className="p-3 bg-card border border-primary/30 rounded-xl space-y-1 bg-primary/5">
                  <span className="text-[10px] font-bold text-success uppercase block">4. AI Intelligence Output</span>
                  <p className="text-[11px] text-foreground font-semibold">Score • Gaps • Roadmap • NBA</p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* 4. Skills Inventory Section */}
          <StaggerItem>
            <Card className="p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Skills Inventory</h3>
                    <p className="text-[10px] text-muted">What CareerOS currently knows about your technical capabilities</p>
                  </div>
                </div>
                <div className="flex bg-accent rounded-xl p-1">
                  {(["All", "Verified"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search, Add & Sort Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search skills (e.g. React, Docker, Python)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-accent/20 border border-border outline-none rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder-muted focus:border-primary/50"
                  />
                </div>

                <form onSubmit={handleAddCustomSkill} className="flex gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Add custom skill..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    className="bg-accent/20 border border-border outline-none rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted focus:border-primary/50 w-44"
                  />
                  <Button type="submit" variant="primary" size="sm" className="text-xs font-bold shrink-0 cursor-pointer">
                    + Add Skill
                  </Button>
                </form>
                
                <div className="flex items-center gap-2 shrink-0">
                  <SlidersHorizontal className="w-4 h-4 text-muted" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="bg-accent/20 border border-border outline-none rounded-xl px-3 py-2 text-xs text-foreground"
                  >
                    <option value="name">Sort: Name A-Z</option>
                    <option value="category">Sort: Category</option>
                  </select>
                </div>
              </div>

              {/* Skills Grid */}
              {processedSkillsList.length === 0 ? (
                <EmptyState 
                  title="No skills match your filter" 
                  description="Adjust your search query or filter settings above." 
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                  {processedSkillsList.map((skill, i) => (
                    <div 
                      key={`${skill.name}-${i}`}
                      onClick={() => handleToggleSkill(skill.name, skill.category)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        skill.isPossessed 
                          ? "bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-xs" 
                          : "bg-card border-border/80 hover:bg-accent/30"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          <span>{skill.name}</span>
                          {skill.isVerified && (
                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold uppercase" title="Evidence-supported from resume/GitHub">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-muted font-bold uppercase">{skill.category}</div>
                      </div>
                      <div>
                        {skill.isPossessed ? (
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted/50" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </StaggerItem>

          {/* 5. Evidence-Based Core Strengths & Growth Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Core Strengths */}
            <div className="lg:col-span-6">
              <StaggerItem>
                <Card className="p-6 h-full flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 border-b border-border pb-3">
                      <ShieldCheck className="w-5 h-5 text-success" />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Core Strengths</h3>
                        <p className="text-[10px] text-muted">Strengths identified from your current career evidence</p>
                      </div>
                    </div>

                    {realStrengths.length > 0 ? (
                      <div className="space-y-2.5">
                        {realStrengths.map((strength, idx) => (
                          <div key={idx} className="p-3 bg-success/5 border border-success/20 rounded-xl flex items-center justify-between text-xs font-semibold text-foreground">
                            <span>{strength}</span>
                            <Badge variant="success">Evidence Verified</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border border-dashed border-border rounded-2xl space-y-2 bg-accent/5">
                        <ShieldCheck className="w-6 h-6 text-muted mx-auto opacity-50" />
                        <h4 className="text-xs font-bold text-foreground">No evidence-backed strengths identified yet</h4>
                        <p className="text-[11px] text-muted max-w-xs mx-auto">
                          Upload your resume or connect GitHub so CareerOS can evaluate and extract your core technical strengths.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </StaggerItem>
            </div>

            {/* Growth Areas */}
            <div className="lg:col-span-6">
              <StaggerItem>
                <Card className="p-6 h-full flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 border-b border-border pb-3">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Growth Areas</h3>
                        <p className="text-[10px] text-muted">Areas where your profile has room to improve relative to your target role</p>
                      </div>
                    </div>

                    {realGrowthAreas.length > 0 ? (
                      <div className="space-y-2.5">
                        {realGrowthAreas.map((gap, idx) => (
                          <div key={idx} className="p-3 bg-warning/5 border border-warning/20 rounded-xl flex items-center justify-between text-xs font-semibold text-foreground">
                            <span>{gap}</span>
                            <Badge variant="warning">Target Gap</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border border-dashed border-border rounded-2xl space-y-2 bg-accent/5">
                        <AlertTriangle className="w-6 h-6 text-muted mx-auto opacity-50" />
                        <h4 className="text-xs font-bold text-foreground">No active growth areas identified</h4>
                        <p className="text-[11px] text-muted max-w-xs mx-auto">
                          CareerOS needs more career evidence to identify specific growth gaps for your target role.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </StaggerItem>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

export default function CareerDnaPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted font-semibold">Loading Career DNA & Intelligence...</span>
        </div>
      </div>
    }>
      <CareerDnaContent />
    </Suspense>
  );
}
