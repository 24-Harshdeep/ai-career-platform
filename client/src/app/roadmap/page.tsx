"use client";

import React, { useEffect } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Badge from "@/components/ui/Badge/Badge";
import { Map, CheckCircle2, Circle } from "lucide-react";

export default function RoadmapPage() {
  const storeRoadmap = useCareerStore((state) => state.roadmap);
  const toggleSubSkillMastery = useCareerStore((state) => state.toggleSubSkillMastery);
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);
  const addNotification = useCareerStore((state) => state.addNotification);

  // Sync dashboard values on initial render
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const toggleSubskill = async (subSkillId: string, currentlyMastered: boolean, name: string) => {
    const nextMasteryState = !currentlyMastered;
    await toggleSubSkillMastery(subSkillId, nextMasteryState);

    if (nextMasteryState) {
      addNotification(`Mastered skill: ${name}! XP awarded.`, "success");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
          <Map className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Interactive Learning Roadmap</h2>
          <p className="text-xs text-muted">Core milestones, technical checkpoints, and skill trackers tailored to your career goal.</p>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {storeRoadmap && storeRoadmap.length > 0 ? (
          storeRoadmap.map((track) => (
            <Card key={track.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4 mb-5">
                {/* Header */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">{track.title}</h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Focus Module</span>
                    <Badge variant={track.progress >= 80 ? "success" : "warning"}>
                      {track.progress}% Complete
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar Display */}
                <div className="w-full md:w-64 space-y-1">
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

              {/* Checklists grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(track.modules || []).flatMap((mod) => 
                  (mod.subSkills || []).map((sub) => ({ ...sub, moduleTitle: mod.title }))
                ).map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => toggleSubskill(sub.id, sub.mastered, sub.title)}
                    className="flex items-start space-x-3 p-3 rounded-xl border border-border bg-accent/5 hover:bg-accent/15 transition-all text-left group cursor-pointer"
                  >
                    {sub.mastered ? (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted group-hover:text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <span
                        className={`text-xs font-semibold text-foreground ${
                          sub.mastered ? "line-through text-muted" : ""
                        }`}
                      >
                        {sub.title}
                      </span>
                      <p className="text-[9px] text-muted">
                        {sub.moduleTitle} • {sub.mastered ? "Milestone verified" : `Click to mark complete (+${sub.xpReward} XP)`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          ))
        ) : (
          <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
            <p className="text-sm text-muted">No learning tracks initialized yet. Configure your Career DNA to load custom roadmaps.</p>
          </div>
        )}
      </div>
    </div>
  );
}
