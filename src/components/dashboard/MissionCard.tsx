"use client";

import React from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Badge from "@/components/ui/Badge/Badge";
import { CheckCircle2, Circle, Target, Trophy } from "lucide-react";

export const MissionCard: React.FC = () => {
  const missions = useCareerStore((state) => state.missions);
  const completeMission = useCareerStore((state) => state.completeMission);

  const activeMissions = missions.filter((m) => !m.completed);
  const completedMissions = missions.filter((m) => m.completed);

  return (
    <Card className="h-full flex flex-col justify-between p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Today's Mission</h3>
          </div>
          <Badge variant="warning">
            <Trophy className="w-3.5 h-3.5 mr-1" />
            <span>Active Challenges</span>
          </Badge>
        </div>

        {/* Active Missions list */}
        <div className="space-y-3">
          {activeMissions.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted bg-accent/10 border border-dashed border-border rounded-xl">
              All missions complete! New tasks arrive tomorrow.
            </div>
          ) : (
            activeMissions.map((mission) => (
              <button
                key={mission.id}
                onClick={() => completeMission(mission.id)}
                className="w-full flex items-start space-x-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-all duration-200 text-left group cursor-pointer"
              >
                <Circle className="w-5 h-5 text-muted group-hover:text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-tight">
                    {mission.title}
                  </p>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <span className="text-[10px] text-success font-medium">
                      Reward: +{mission.scoreReward} Score
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Completed list */}
        {completedMissions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
              Completed Today
            </span>
            <div className="space-y-2">
              {completedMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-start space-x-3 p-2 text-muted text-xs opacity-75"
                >
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span className="line-through">{mission.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MissionCard;
