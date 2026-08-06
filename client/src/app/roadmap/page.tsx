"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import {
  Map,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Unlock,
  Info,
  DollarSign,
  Briefcase,
  ChevronDown,
  ChevronUp,
  FileText
} from "lucide-react";
import PoweredBy from "@/components/ui/PoweredBy";

// Mapped AI Metadata configuration for all subskill IDs in the templates
const AI_ROADMAP_METADATA: Record<string, {
  time: string;
  scoreGain: number;
  prerequisite: string;
  unlocks: string;
  explanation: string;
  tip: string;
  resources: string[];
  marketDemand: string;
  salaryImpact: string;
  atsAlignment: string;
}> = {
  // Frontend Track
  "fe-sub-1": {
    time: "2.5 Hours",
    scoreGain: 4,
    prerequisite: "React Basics",
    unlocks: "Actions & useActionState",
    explanation: "React Server Components execute logic exclusively on the server, avoiding massive JavaScript package downloads for high speed.",
    tip: "Keep stateful operations (useState, useEffect) in separate client components to maximize RSC optimization.",
    resources: ["https://react.dev/reference/rsc/server-components", "https://nextjs.org/docs/app/building-your-application/rendering/server-components"],
    marketDemand: "94%",
    salaryImpact: "+$4,800/yr",
    atsAlignment: "+7%"
  },
  "fe-sub-2": {
    time: "2 Hours",
    scoreGain: 3,
    prerequisite: "React Server Components",
    unlocks: "Optimistic UI updates",
    explanation: "React 19 forms actions handle asynchronous mutations and native error states natively, reducing client boilerplate code.",
    tip: "Use the new useActionState hook to manage validation states directly from form actions.",
    resources: ["https://react.dev/reference/react/useActionState", "https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations"],
    marketDemand: "91%",
    salaryImpact: "+$3,500/yr",
    atsAlignment: "+5%"
  },
  "fe-sub-3": {
    time: "1.5 Hours",
    scoreGain: 3,
    prerequisite: "Actions & useActionState",
    unlocks: "Frontend Track Completion",
    explanation: "Optimistic UI state updates simulate successful responses instantly before network promises settle, yielding zero user latency.",
    tip: "Use the useOptimistic hook to instantly render changes during network requests.",
    resources: ["https://react.dev/reference/react/useOptimistic"],
    marketDemand: "88%",
    salaryImpact: "+$2,800/yr",
    atsAlignment: "+4%"
  },
  "fe-sub-4": {
    time: "2 Hours",
    scoreGain: 3,
    prerequisite: "Basic CSS layout grid",
    unlocks: "View Transitions API",
    explanation: "Container queries apply styles based on the size of a parent element container rather than the global viewport width.",
    tip: "Use container queries with inline-size parameters to build highly reusable standalone layout components.",
    resources: ["https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries"],
    marketDemand: "92%",
    salaryImpact: "+$4,000/yr",
    atsAlignment: "+6%"
  },
  "fe-sub-5": {
    time: "3 Hours",
    scoreGain: 4,
    prerequisite: "CSS Container Queries",
    unlocks: "UI animation benchmarks",
    explanation: "View Transitions API automates animations between DOM mutations, transforming standard transitions into fluid app wipes.",
    tip: "Always check document.startViewTransition compatibility and supply fallback transitions for older engines.",
    resources: ["https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API"],
    marketDemand: "87%",
    salaryImpact: "+$3,100/yr",
    atsAlignment: "+4%"
  },

  // Backend Track
  "be-sub-1": {
    time: "2 Hours",
    scoreGain: 3,
    prerequisite: "Node.js Basics",
    unlocks: "Zod validation schema rules",
    explanation: "Structured routers map request endpoints clean of controller logic, enforcing solid microservice architectures.",
    tip: "Group endpoint paths under separate sub-routers with logical REST method names.",
    resources: ["https://expressjs.com/en/guide/routing.html"],
    marketDemand: "95%",
    salaryImpact: "+$5,200/yr",
    atsAlignment: "+8%"
  },
  "be-sub-2": {
    time: "1.5 Hours",
    scoreGain: 3,
    prerequisite: "Express REST Router",
    unlocks: "Bcrypt secure password hashing",
    explanation: "Zod runtime object parsing filters unexpected request body properties before controllers execute business logic.",
    tip: "Create reusable middleware to validate headers, queries, and bodies against target schemas.",
    resources: ["https://zod.dev/"],
    marketDemand: "89%",
    salaryImpact: "+$3,800/yr",
    atsAlignment: "+5%"
  },
  "be-sub-3": {
    time: "1 Hour",
    scoreGain: 4,
    prerequisite: "Zod request schema validation",
    unlocks: "JWT token verification middleware",
    explanation: "Bcrypt cryptographically salts and hashes plain-text credentials to ensure safe authentication storage.",
    tip: "Use a salt factor of 10-12 to strike the optimal balance between security limits and request latency.",
    resources: ["https://github.com/kelektiv/node.bcrypt.js"],
    marketDemand: "93%",
    salaryImpact: "+$4,500/yr",
    atsAlignment: "+6%"
  },
  "be-sub-4": {
    time: "2 Hours",
    scoreGain: 4,
    prerequisite: "Bcrypt secure hashing",
    unlocks: "Rate limiting and Helmet security",
    explanation: "JSON Web Tokens verify secure user identity assertions stateless, eliminating complex session tables in databases.",
    tip: "Store tokens in HTTP-only, secure, SameSite cookies to protect transactions against XSS and CSRF vector strikes.",
    resources: ["https://jwt.io/introduction/"],
    marketDemand: "96%",
    salaryImpact: "+$6,000/yr",
    atsAlignment: "+9%"
  },
  "be-sub-5": {
    time: "2 Hours",
    scoreGain: 3,
    prerequisite: "JWT token verification",
    unlocks: "Backend Track Completion",
    explanation: "Rate limiting prevents brute force vector floods. Helmet sets HTTP headers to block security vulnerability leaks.",
    tip: "Configure distinct rate limit limits on login routes compared to public assets.",
    resources: ["https://github.com/helmetjs/helmet", "https://github.com/express-rate-limit/express-rate-limit"],
    marketDemand: "90%",
    salaryImpact: "+$3,400/yr",
    atsAlignment: "+5%"
  },

  // System Design Track
  "sd-sub-1": {
    time: "2 Hours",
    scoreGain: 4,
    prerequisite: "Database basics",
    unlocks: "Database indexing execution plans",
    explanation: "Redis in-memory caching intercepts intensive database read traffic, serving cached records in sub-millisecond rates.",
    tip: "Select cache eviction strategies like LRU (Least Recently Used) and enforce strict key TTL expirations.",
    resources: ["https://redis.io/docs/manual/eviction/"],
    marketDemand: "92%",
    salaryImpact: "+$6,200/yr",
    atsAlignment: "+8%"
  },
  "sd-sub-2": {
    time: "2.5 Hours",
    scoreGain: 4,
    prerequisite: "Redis memory cache",
    unlocks: "Docker multi-stage builds",
    explanation: "Query execution plans show index scans vs. table scans, pinpointing database query execution bottlenecks.",
    tip: "Always run EXPLAIN ANALYZE on slow query statements to trace the underlying scans and index coverage.",
    resources: ["https://www.postgresql.org/docs/current/using-explain.html"],
    marketDemand: "94%",
    salaryImpact: "+$7,000/yr",
    atsAlignment: "+9%"
  },
  "sd-sub-3": {
    time: "3 Hours",
    scoreGain: 4,
    prerequisite: "Database indexing",
    unlocks: "GitHub Actions automated pipelines",
    explanation: "Docker multi-stage compilation builds compile source code in builder containers, keeping target images tiny and fast.",
    tip: "Utilize distinct cache layers for dependencies to avoid slow container rebuild cycles.",
    resources: ["https://docs.docker.com/build/building/multi-stage/"],
    marketDemand: "95%",
    salaryImpact: "+$6,800/yr",
    atsAlignment: "+8%"
  },
  "sd-sub-4": {
    time: "2 Hours",
    scoreGain: 4,
    prerequisite: "Docker multi-stage builds",
    unlocks: "System Design Track Completion",
    explanation: "CI/CD pipelines automate testing, building, and deployment procedures on commit, ensuring continuous delivery.",
    tip: "Use matrices in GitHub Actions jobs to run automated test suites in parallel.",
    resources: ["https://docs.github.com/en/actions"],
    marketDemand: "93%",
    salaryImpact: "+$5,800/yr",
    atsAlignment: "+7%"
  }
};

// Mapped AI track-level metadata configurations
const AI_TRACK_METADATA: Record<string, {
  demand: string;
  salaryImpact: string;
  atsAlignment: string;
  reasoning: string;
}> = {
  "frontend-v1": {
    demand: "93% High",
    salaryImpact: "+$6,500/yr",
    atsAlignment: "+8% Match",
    reasoning: "Target companies like Stripe and Vercel heavily prioritize Next.js App Router performance optimizations and strict React 19 execution schemas."
  },
  "backend-v1": {
    demand: "89% High",
    salaryImpact: "+$5,500/yr",
    atsAlignment: "+6% Match",
    reasoning: "Express router validation and security controls are critical to prevent injection vulnerabilities and secure SaaS backend APIs."
  },
  "system-design-v1": {
    demand: "91% High",
    salaryImpact: "+$8,000/yr",
    atsAlignment: "+10% Match",
    reasoning: "Docker containerization and caching systems ensure your applications scale cost-effectively under load, which is a major factor in senior engineering evaluations."
  }
};

export default function RoadmapPage() {
  const storeRoadmap = useCareerStore((state) => state.roadmap);
  const toggleSubSkillMastery = useCareerStore((state) => state.toggleSubSkillMastery);
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);
  const fetchRoadmap = useCareerStore((state) => state.fetchRoadmap);
  const addNotification = useCareerStore((state) => state.addNotification);
  const stats = useCareerStore((state) => state.stats);

  const [expandedSubSkill, setExpandedSubSkill] = useState<string | null>(null);

  // Sync dashboard values and full roadmap details on initial render
  useEffect(() => {
    fetchDashboardData();
    fetchRoadmap();
  }, [fetchDashboardData, fetchRoadmap]);

  // Handler to toggle subskill mastery
  const toggleSubskill = async (subSkillId: string, currentlyMastered: boolean, name: string) => {
    const nextMasteryState = !currentlyMastered;
    await toggleSubSkillMastery(subSkillId, nextMasteryState);

    if (nextMasteryState) {
      addNotification(`Mastered skill: ${name}! XP awarded.`, "success");
    }
  };

  // 1. Dynamic Progress Calculations
  const roadmapStats = useMemo(() => {
    let completedCount = 0;
    let totalCount = 0;
    let nextBestScoreImpactSum = 0;

    storeRoadmap.forEach((track) => {
      (track.modules || []).forEach((mod) => {
        (mod.subSkills || []).forEach((sub) => {
          totalCount++;
          if (sub.mastered) {
            completedCount++;
          }
        });
      });
    });

    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    // Find the next best step for each track to compute projected score gain
    const nextBestSteps = storeRoadmap.map(track => {
      let found: any = null;
      (track.modules || []).forEach((mod) => {
        (mod.subSkills || []).forEach((sub) => {
          if (!sub.mastered && !found) {
            const meta = AI_ROADMAP_METADATA[sub.id];
            found = { ...sub, moduleTitle: mod.title, meta };
          }
        });
      });
      return found;
    }).filter(Boolean);

    nextBestSteps.forEach((step: any) => {
      nextBestScoreImpactSum += step.meta?.scoreGain || 3;
    });

    const currentScore = stats.score || 82;
    const targetScore = Math.min(100, currentScore + Math.max(1, nextBestSteps.length * 2));
    const remainingTasks = totalCount - completedCount;
    // Assume 1 week per remaining task on average
    const estimatedWeeks = Math.max(1, remainingTasks);

    return {
      progressPercent,
      jobReadiness: stats.readiness?.jobReadiness || 61,
      currentScore,
      targetScore,
      estimatedWeeks,
      nextBestSteps
    };
  }, [storeRoadmap, stats]);

  // 2. Track Next Best Step lookup helper
  const getTrackNextBestStep = (trackId: string) => {
    let nextStep: any = null;
    const track = storeRoadmap.find(t => t.id === trackId);
    if (!track) return null;

    (track.modules || []).forEach((mod) => {
      (mod.subSkills || []).forEach((sub) => {
        if (!sub.mastered && !nextStep) {
          const meta = AI_ROADMAP_METADATA[sub.id];
          nextStep = {
            ...sub,
            moduleTitle: mod.title,
            meta
          };
        }
      });
    });
    return nextStep;
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title block with live indicators */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl relative">
            <Map className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-background animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-foreground">Interactive AI Career Roadmap</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-success/10 text-success border border-success/20">
                <span className="w-1.5 h-1.5 mr-1 bg-success rounded-full animate-ping" />
                AI Routing Engine: Active
              </span>
            </div>
            <p className="text-xs text-muted max-w-2xl mt-1 leading-relaxed">
              This personalized AI-driven learning roadmap continuously aligns your skills with real-time market demands to ensure you are fully job-ready.
            </p>
          </div>
        </div>
        <PoweredBy engines={[
          {
            type: "engine",
            label: "Next Best Action Engine",
            description: "Calculates priority paths for training sequencing.",
            points: ["Calculates task priority", "Determines skill dependencies", "Generates optimal learning sequence"]
          },
          {
            type: "user",
            label: "User Action",
            description: "Tracks user progress through training modules.",
            points: ["Marks sub-skills as Mastered", "Tracks overall track progress"]
          },
          {
            type: "ai",
            label: "AI Explanations",
            description: "Enriches learning cards with custom educational materials.",
            points: ["Explains why to learn concepts", "Suggests articles/resources", "Provides mini tutorials & alternative paths"]
          }
        ]} />
      </div>

      {/* Global Core Projections Metrics Card */}
      <Card className="p-6 bg-gradient-to-br from-card to-accent/5">
        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">CareerOS Core Projections</h3>
          </div>
          <Badge variant="ai">AI Confidence: 91%</Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Progress dial */}
          <div className="bg-accent/10 border border-border/50 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Current Progress</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-foreground">{roadmapStats.progressPercent}%</span>
              <div className="h-6 w-16 bg-accent/20 rounded-full overflow-hidden mb-1">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${roadmapStats.progressPercent}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Job Readiness */}
          <div className="bg-accent/10 border border-border/50 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Job Readiness</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-success">{roadmapStats.jobReadiness}%</span>
              <span className="text-[10px] text-muted font-semibold mb-1">Target: 85%+</span>
            </div>
          </div>

          {/* Career Score */}
          <div className="bg-accent/10 border border-border/50 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Career Score</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-foreground flex items-center gap-1.5">
                {roadmapStats.currentScore} <ArrowRight className="w-4 h-4 text-primary shrink-0" /> {roadmapStats.targetScore}
              </span>
              <span className="text-[10px] text-primary font-bold mb-1">Projected</span>
            </div>
          </div>

          {/* Completion Time */}
          <div className="bg-accent/10 border border-border/50 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Est. Completion</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-foreground">{roadmapStats.estimatedWeeks} Weeks</span>
              <span className="text-[10px] text-muted font-semibold mb-1">On Track</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Modules List */}
      <div className="space-y-6">
        {storeRoadmap && storeRoadmap.length > 0 ? (
          storeRoadmap.map((track) => {
            const trackMeta = AI_TRACK_METADATA[track.id] || {
              demand: "High",
              salaryImpact: "+$5,000/yr",
              atsAlignment: "+5%",
              reasoning: "Aligned with industry core standards."
            };

            const nextBestStep = getTrackNextBestStep(track.id);

            return (
              <Card key={track.id} className="p-6 space-y-6">
                
                {/* Track Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-foreground">{track.title}</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Focus Module</span>
                      <Badge variant={track.progress >= 80 ? "success" : "warning"}>
                        {track.progress}% Complete
                      </Badge>
                    </div>
                  </div>

                  {/* Track Progress Bar */}
                  <div className="w-full md:w-64 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-muted">
                      <span>Track Progress</span>
                      <span>{track.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                        style={{ width: `${track.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Track Projections & Next Best Action Column Block */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Block: Next Best Action & AI reasoning */}
                  <div className="lg:col-span-6 space-y-4">
                    {nextBestStep ? (
                      <div className="border border-primary/20 bg-primary/5 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                        <div className="flex justify-between items-center">
                          <span className="inline-flex items-center text-[10px] font-black text-primary uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 mr-1" /> Next Best Step
                          </span>
                          <Badge variant="primary" className="text-[9px] px-1.5 py-0.5">Recommended</Badge>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{nextBestStep.title}</h4>
                          <span className="text-[10px] text-muted block mt-0.5">{nextBestStep.moduleTitle}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold mt-2">
                          <div className="bg-accent/10 border border-border/30 rounded-lg p-1.5">
                            <span className="text-muted block text-[9px] uppercase">Est. Time</span>
                            <span className="text-foreground">{nextBestStep.meta?.time || "2 Hours"}</span>
                          </div>
                          <div className="bg-accent/10 border border-border/30 rounded-lg p-1.5">
                            <span className="text-muted block text-[9px] uppercase">Score Gain</span>
                            <span className="text-primary">+{nextBestStep.meta?.scoreGain || 3} Score</span>
                          </div>
                          <div className="bg-accent/10 border border-border/30 rounded-lg p-1.5">
                            <span className="text-muted block text-[9px] uppercase">Prereq</span>
                            <span className="text-foreground truncate max-w-full block" title={nextBestStep.meta?.prerequisite}>
                              {nextBestStep.meta?.prerequisite || "None"}
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] text-muted pt-2 border-t border-primary/10 flex items-center gap-1.5">
                          <Unlock className="w-3.5 h-3.5 text-secondary" />
                          <span>Unlocks: <span className="font-semibold text-foreground">{nextBestStep.meta?.unlocks || "Next Module"}</span></span>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-success/20 bg-success/5 rounded-2xl p-4 text-center py-8">
                        <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-foreground">Track Fully Mastered!</h4>
                        <p className="text-xs text-muted mt-1">Excellent work, you have completed all checkpoints in this track.</p>
                      </div>
                    )}

                    {/* AI Reasoning Block */}
                    <div className="bg-accent/10 border border-border/50 rounded-2xl p-4 space-y-2">
                      <span className="text-[10px] font-bold text-muted uppercase block">AI Reasoning</span>
                      <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                        {trackMeta.reasoning}
                      </p>
                    </div>
                  </div>

                  {/* Right Block: Track Market Insights */}
                  <div className="lg:col-span-6 flex flex-col justify-between">
                    <div className="bg-accent/5 border border-border/50 rounded-2xl p-4 space-y-4 h-full flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block border-b border-border/40 pb-2">Track Market Intelligence</span>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted font-semibold uppercase block">Market Demand</span>
                          <span className="text-sm font-bold text-foreground flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-success" />
                            {trackMeta.demand}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-muted font-semibold uppercase block">Est. Salary Impact</span>
                          <span className="text-sm font-bold text-foreground flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-success" />
                            {trackMeta.salaryImpact}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-muted font-semibold uppercase block">ATS Alignment</span>
                          <span className="text-sm font-bold text-foreground flex items-center gap-1">
                            <Briefcase className="w-4 h-4 text-primary" />
                            {trackMeta.atsAlignment}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-muted leading-relaxed pt-2 border-t border-border/40">
                        Completing this track builds credential weight verifying your practical execution capability during recruiters' portfolio audits.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Subskills Checklists grid */}
                <div className="space-y-3 pt-4 border-t border-border/40">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Technical Checkpoints Checklist</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(track.modules || []).flatMap((mod) =>
                      (mod.subSkills || []).map((sub) => ({ ...sub, moduleTitle: mod.title }))
                    ).map((sub) => {
                      const meta = AI_ROADMAP_METADATA[sub.id] || {
                        time: "2 Hours",
                        scoreGain: 3,
                        prerequisite: "None",
                        unlocks: "Next step",
                        explanation: "Core engineering concept.",
                        tip: "Practice implementation locally.",
                        resources: [],
                        marketDemand: "85%",
                        salaryImpact: "+$2,000/yr",
                        atsAlignment: "+3%"
                      };

                      const isNextBest = nextBestStep?.id === sub.id;

                      return (
                        <div
                          key={sub.id}
                          className={`rounded-2xl border transition-all duration-300 ${
                            sub.mastered
                              ? "bg-accent/5 border-border/40 text-muted opacity-80"
                              : isNextBest
                              ? "bg-primary/5 border-primary/40 shadow-[0_4px_12px_rgba(99,102,241,0.08)]"
                              : "bg-accent/10 border-border/80 hover:border-primary/20"
                          }`}
                        >
                          {/* Main Row */}
                          <div className="flex items-start justify-between p-3.5 gap-3">
                            <button
                              type="button"
                              onClick={() => toggleSubskill(sub.id, sub.mastered, sub.title)}
                              className="flex items-start space-x-3 text-left group cursor-pointer flex-1 min-w-0"
                            >
                              {sub.mastered ? (
                                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted group-hover:text-primary shrink-0 mt-0.5" />
                              )}
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-xs font-bold text-foreground ${
                                      sub.mastered ? "line-through text-muted" : ""
                                    }`}
                                  >
                                    {sub.title}
                                  </span>
                                  {isNextBest && (
                                    <Badge variant="ai" className="text-[8px] py-0 px-1 font-bold">
                                      NEXT
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[9px] text-muted truncate">
                                  {sub.moduleTitle} • {sub.mastered ? "Milestone verified" : `+${sub.xpReward} XP`}
                                </p>
                              </div>
                            </button>

                            {/* Actions Right */}
                            <div className="flex items-center space-x-2 shrink-0">
                              <Badge variant={sub.mastered ? "success" : isNextBest ? "primary" : "muted"} className="text-[8px] px-1 py-0.5">
                                {meta.time}
                              </Badge>
                              <button
                                type="button"
                                className="p-1 text-muted hover:text-foreground rounded-lg hover:bg-accent/20 transition-colors"
                                onClick={() => setExpandedSubSkill(expandedSubSkill === sub.id ? null : sub.id)}
                                title="Expand Details"
                              >
                                {expandedSubSkill === sub.id ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Info Drawer */}
                          {expandedSubSkill === sub.id && (
                            <div className="border-t border-border/40 p-3.5 bg-accent/5 text-[11px] text-muted space-y-3 animate-fade-in-up">
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-foreground uppercase block">AI Skill Explanation</span>
                                <p className="leading-relaxed">{meta.explanation}</p>
                              </div>

                              <div className="bg-primary/5 border border-primary/10 rounded-xl p-2.5 space-y-1">
                                <span className="text-[9px] font-bold text-primary block">AI Study Tip</span>
                                <p className="leading-relaxed">{meta.tip}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold border-t border-border/30 pt-2.5">
                                <div>Market Demand: <span className="text-foreground">{meta.marketDemand}</span></div>
                                <div>ATS Alignment: <span className="text-foreground">{meta.atsAlignment}</span></div>
                                <div>Est. Salary Impact: <span className="text-foreground text-success font-bold">{meta.salaryImpact}</span></div>
                                <div>Unlocked Prereq: <span className="text-foreground">{meta.prerequisite}</span></div>
                              </div>

                              {meta.resources && meta.resources.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <span className="text-[9px] font-bold text-foreground uppercase block">Suggested Resources</span>
                                  <div className="flex flex-col gap-1">
                                    {meta.resources.map((link, idx) => (
                                      <a
                                        key={idx}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                      >
                                        <FileText className="w-3.5 h-3.5 shrink-0" />
                                        Resource Document {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>

              </Card>
            );
          })
        ) : (
          <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
            <p className="text-sm text-muted">No learning tracks initialized yet. Configure your Career DNA to load custom roadmaps.</p>
          </div>
        )}
      </div>
    </div>
  );
}
