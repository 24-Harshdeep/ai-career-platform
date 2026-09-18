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
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";

export default function RoadmapPage() {
  const storeRoadmap = useCareerStore((state) => state.roadmap);
  const toggleSubSkillMastery = useCareerStore((state) => state.toggleSubSkillMastery);
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);
  const fetchRoadmap = useCareerStore((state) => state.fetchRoadmap);
  const addNotification = useCareerStore((state) => state.addNotification);
  const stats = useCareerStore((state) => state.stats);
  const storeUser = useCareerStore((state) => state.user);
  const profile = useCareerStore((state) => state.profile);
  const resumeAnalysis = useCareerStore((state) => state.resumeAnalysis);

  const [expandedSubSkill, setExpandedSubSkill] = useState<string | null>(null);

  // Sync dashboard values and full roadmap details on initial render
  useEffect(() => {
    const loadRoadmapData = async () => {
      await fetchDashboardData();
      await fetchRoadmap();
    };
    loadRoadmapData();
  }, [fetchDashboardData, fetchRoadmap]);

  // Handler to toggle subskill mastery
  const toggleSubskill = async (subSkillId: string, currentlyMastered: boolean, name: string) => {
    const nextMasteryState = !currentlyMastered;
    await toggleSubSkillMastery(subSkillId, nextMasteryState);

    if (nextMasteryState) {
      addNotification(`Mastered skill: ${name}! XP awarded.`, "success");
    }
  };

  const targetRole = profile?.targetRole || storeUser?.goal || "Full Stack Developer";

  // Dynamic Progress Calculations derived 100% from backend data & store
  const roadmapStats = useMemo(() => {
    let completedCount = 0;
    let totalCount = 0;
    let nextBestScoreImpactSum = 0;

    storeRoadmap.forEach((track) => {
      (track.modules || []).forEach((mod) => {
        (mod.subSkills || []).forEach((sub: any) => {
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
        (mod.subSkills || []).forEach((sub: any) => {
          if (!sub.mastered && !found) {
            found = { ...sub, moduleTitle: mod.title };
          }
        });
      });
      return found;
    }).filter(Boolean);

    nextBestSteps.forEach((step: any) => {
      nextBestScoreImpactSum += step.scoreGain || (step.xpReward ? Math.ceil(step.xpReward / 15) : 3);
    });

    const currentScore = stats?.score ?? storeUser?.score ?? 0;
    const projectedScore = Math.min(100, currentScore + Math.max(1, nextBestScoreImpactSum));
    const remainingTasks = totalCount - completedCount;
    const estimatedWeeks = Math.max(1, Math.ceil(remainingTasks / 2));
    const jobReadiness = stats?.readiness?.jobReadiness ?? 0;

    return {
      progressPercent,
      jobReadiness,
      currentScore,
      projectedScore,
      scoreGainSum: nextBestScoreImpactSum,
      estimatedWeeks,
      nextBestSteps
    };
  }, [storeRoadmap, stats, storeUser]);

  // Track Next Best Step lookup helper
  const getTrackNextBestStep = (trackId: string) => {
    let nextStep: any = null;
    const track = storeRoadmap.find(t => t.id === trackId);
    if (!track) return null;

    (track.modules || []).forEach((mod) => {
      (mod.subSkills || []).forEach((sub: any) => {
        if (!sub.mastered && !nextStep) {
          nextStep = {
            ...sub,
            moduleTitle: mod.title
          };
        }
      });
    });
    return nextStep;
  };

  return (
    <PageTransition className="space-y-6 pb-12">
      <StaggerItem>
        <PageHeader
          icon={Map}
          title="Interactive AI Career Roadmap"
          description="This personalized AI-driven learning roadmap continuously aligns your skills with real-time market demands to ensure you are fully job-ready."
        >
          <span className="inline-flex items-center text-xs font-medium text-muted bg-accent px-2.5 py-1 rounded-full border border-border">
            <span className="w-1.5 h-1.5 mr-2 bg-success rounded-full animate-ping" />
            Synced with CareerContext
          </span>
        </PageHeader>
      </StaggerItem>

      {/* Global Core Projections Metrics Card */}
      <Card className="p-6 bg-gradient-to-br from-card to-accent/5">
        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">CareerOS Core Projections</h3>
          </div>
          <Badge variant="ai">Synced with CareerContext</Badge>
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
              <div>
                <span className="text-[9px] text-muted font-bold block uppercase">Current Score: {roadmapStats.currentScore}</span>
                <span className="text-xl font-black text-foreground flex items-center gap-1 mt-0.5">
                  {roadmapStats.currentScore} <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" /> {roadmapStats.projectedScore}
                </span>
              </div>
              <span className="text-[10px] text-primary font-bold mb-1">
                +{roadmapStats.scoreGainSum} pts projected
              </span>
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
                            <span className="text-foreground">{nextBestStep.time || "2 Hours"}</span>
                          </div>
                          <div className="bg-accent/10 border border-border/30 rounded-lg p-1.5">
                            <span className="text-muted block text-[9px] uppercase">Score Gain</span>
                            <span className="text-primary">+{nextBestStep.scoreGain || (nextBestStep.xpReward ? Math.ceil(nextBestStep.xpReward / 15) : 3)} Score</span>
                          </div>
                          <div className="bg-accent/10 border border-border/30 rounded-lg p-1.5">
                            <span className="text-muted block text-[9px] uppercase">Prereq</span>
                            <span className="text-foreground truncate max-w-full block" title={nextBestStep.prerequisite}>
                              {nextBestStep.prerequisite || "None"}
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] text-muted pt-2 border-t border-primary/10 flex items-center gap-1.5">
                          <Unlock className="w-3.5 h-3.5 text-secondary" />
                          <span>Unlocks: <span className="font-semibold text-foreground">{nextBestStep.unlocks || "Next Module"}</span></span>
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
                        {(track as any).reasoning || `Target role is set to ${targetRole}. Completing checkpoints in this module directly closes detected skill gaps and increases your overall engineering readiness.`}
                      </p>
                    </div>
                  </div>

                  {/* Right Block: Track Market Intelligence */}
                  <div className="lg:col-span-6 flex flex-col justify-between">
                    <div className="bg-accent/5 border border-border/50 rounded-2xl p-4 space-y-4 h-full flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block border-b border-border/40 pb-2">Track Market Intelligence</span>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted font-semibold uppercase block">Role Alignment</span>
                          <span className="text-sm font-bold text-foreground flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-success" />
                            High Priority
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-muted font-semibold uppercase block">Target Role</span>
                          <span className="text-xs font-bold text-foreground flex items-center gap-1 truncate" title={targetRole}>
                            <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{targetRole}</span>
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-muted font-semibold uppercase block">ATS Alignment</span>
                          <span className="text-xs font-bold text-foreground flex items-center gap-1 truncate" title={resumeAnalysis?.atsScore ? `${resumeAnalysis.atsScore}% ATS Match` : "Evaluated"}>
                            <FileText className="w-3.5 h-3.5 text-secondary shrink-0" />
                            <span>{resumeAnalysis?.atsScore ? `${resumeAnalysis.atsScore}% Match` : "Evaluated"}</span>
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-muted leading-relaxed pt-2 border-t border-border/40">
                        {resumeAnalysis?.missingKeywords && resumeAnalysis.missingKeywords.length > 0
                          ? `Identified resume keyword gaps: ${resumeAnalysis.missingKeywords.slice(0, 3).map((k: any) => typeof k === 'string' ? k : k.keyword).join(", ")}. Completing this track aligns your evidence.`
                          : "Completing this track builds verified credential weight for your target role in recruiters' audits."}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Subskills Checklists grid */}
                <div className="space-y-3 pt-4 border-t border-border/40">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Technical Checkpoints Checklist</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(track.modules || []).flatMap((mod) =>
                      (mod.subSkills || []).map((sub: any) => ({ ...sub, moduleTitle: mod.title }))
                    ).map((sub: any) => {
                      const isNextBest = nextBestStep?.id === sub.id;

                      const subTime = sub.time || "2 Hours";
                      const subScoreGain = sub.scoreGain || (sub.xpReward ? Math.ceil(sub.xpReward / 15) : 3);
                      const subPrereq = sub.prerequisite || "None";
                      const subUnlocks = sub.unlocks || "Next Step";
                      const subExplanation = sub.explanation || "Core engineering concept required for target role capability.";
                      const subTip = sub.tip || "Practice implementing this concept locally or within a project.";
                      const subResources: string[] = sub.resources || [];

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
                                  {sub.moduleTitle} • {sub.mastered ? "Milestone verified" : `+${sub.xpReward || 50} XP`}
                                </p>
                              </div>
                            </button>

                            {/* Actions Right */}
                            <div className="flex items-center space-x-2 shrink-0">
                              <Badge variant={sub.mastered ? "success" : isNextBest ? "primary" : "muted"} className="text-[8px] px-1 py-0.5">
                                {subTime}
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
                                <p className="leading-relaxed">{subExplanation}</p>
                              </div>

                              <div className="bg-primary/5 border border-primary/10 rounded-xl p-2.5 space-y-1">
                                <span className="text-[9px] font-bold text-primary block">AI Study Tip</span>
                                <p className="leading-relaxed">{subTip}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold border-t border-border/30 pt-2.5">
                                <div>Est. Time: <span className="text-foreground">{subTime}</span></div>
                                <div>Score Gain: <span className="text-primary font-bold">+{subScoreGain} Score</span></div>
                                <div>Prerequisite: <span className="text-foreground">{subPrereq}</span></div>
                                <div>Unlocks: <span className="text-foreground">{subUnlocks}</span></div>
                              </div>

                              {subResources && subResources.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <span className="text-[9px] font-bold text-foreground uppercase block">Suggested Resources</span>
                                  <div className="flex flex-col gap-1">
                                    {subResources.map((link: string, idx: number) => (
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
    </PageTransition>
  );
}
