"use client";

import React, { useState } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { Brain, Sparkles, Check, Hourglass, Zap } from "lucide-react";

export const NextActionCard: React.FC = () => {
  const missions = useCareerStore((state) => state.missions);
  const completeMission = useCareerStore((state) => state.completeMission);
  const [loading, setLoading] = useState(false);

  // Target mission is "m-1" (Build API Authentication / JWT module)
  const jwtMission = missions.find((m) => m.id === "m-1");
  const isCompleted = jwtMission?.completed || false;

  const handleStartTask = async () => {
    if (isCompleted) return;
    setLoading(true);
    // Simulate loading/working spinner
    await new Promise((resolve) => setTimeout(resolve, 800));
    completeMission("m-1");
    setLoading(false);
  };

  return (
    <Card variant="insight" className="h-full flex flex-col justify-between p-6">
      {/* Sparkle Glow Top-Right */}
      <div className="absolute right-4 top-4 text-primary opacity-60">
        <Sparkles className="w-5 h-5 animate-pulse" />
      </div>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-xs text-primary font-bold tracking-wider uppercase">
            AI Recommended Action
          </h3>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-foreground leading-tight">
            {isCompleted ? "JWT Authentication Module Completed" : "Complete JWT Authentication"}
          </h4>
          <p className="text-xs text-muted leading-relaxed">
            {isCompleted
              ? "Awesome work! You've successfully finished this module. Your backend skill level has increased."
              : "Set up JSON Web Token generation, token rotation, and middleware guards. This is your highest-impact skill gap."}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-success" />
            <div>
              <p className="text-[10px] text-muted font-medium">Impact</p>
              <p className="text-xs font-bold text-success">+3 Career Score</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Hourglass className="w-4 h-4 text-warning" />
            <div>
              <p className="text-[10px] text-muted font-medium">Est. Time</p>
              <p className="text-xs font-bold text-foreground">
                {isCompleted ? "Completed" : "2 hours"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Button Action */}
      <div className="mt-6">
        {isCompleted ? (
          <div className="w-full flex items-center justify-center space-x-2 bg-success/15 border border-success/35 text-success rounded-xl py-2.5 text-sm font-semibold">
            <Check className="w-4.5 h-4.5" />
            <span>Task Completed</span>
          </div>
        ) : (
          <Button
            variant="ai"
            className="w-full text-sm font-semibold"
            onClick={handleStartTask}
            isLoading={loading}
          >
            Start Task
          </Button>
        )}
      </div>
    </Card>
  );
};

export default NextActionCard;
