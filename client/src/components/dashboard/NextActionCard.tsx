"use client";

import React, { useState } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import { Brain, Sparkles, Check, Hourglass, Zap, ShieldCheck } from "lucide-react";

export const NextActionCard: React.FC = () => {
  const action = useCareerStore((state) => state.stats.nextAction);
  const currentScore = useCareerStore((state) => state.stats.score);
  const hasResumeScanned = useCareerStore((state) => state.hasResumeScanned);
  const hasGithubScanned = useCareerStore((state) => state.hasGithubScanned);
  const m1 = useCareerStore((state) => state.missions.find((m) => m.id === "m-1"));
  const m2 = useCareerStore((state) => state.missions.find((m) => m.id === "m-2"));

  const completeMission = useCareerStore((state) => state.completeMission);
  const [loading, setLoading] = useState(false);

  const isCompleted =
    hasResumeScanned &&
    hasGithubScanned &&
    (m1?.completed || false) &&
    (m2?.completed || false);

  const handleStartTask = async () => {
    if (!action) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (action.title.includes("Resume")) {
      await completeMission("m-3");
    } else if (action.title.includes("JWT")) {
      await completeMission("m-1");
    } else if (action.title.includes("PostgreSQL")) {
      await completeMission("m-2");
    }
    setLoading(false);
  };

  // Fallbacks if data has not loaded from backend yet
  const title = action ? action.title : "Connect & Scan GitHub Portfolio";
  const reason = action ? action.reason : "Index code metrics, project document completeness scores, and commit frequencies.";
  const impact = action ? action.impact : 3;
  const estimatedTime = action ? action.estimatedTime : "15 mins";
  const confidence = action ? action.confidence : 88;
  const nextScore = action ? action.careerScoreAfterCompletion : (currentScore + 3);

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
            {isCompleted ? "All Recommended Tasks Completed" : title}
          </h4>
          <p className="text-xs text-muted leading-relaxed">
            {isCompleted
              ? "Incredible! Your profile is fully optimized for active target engineering applications."
              : reason}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-success" />
            <div>
              <p className="text-[10px] text-muted font-medium">Expected Impact</p>
              <p className="text-xs font-bold text-success">
                {isCompleted ? "Optimal" : `+${impact} Career Score`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Hourglass className="w-4 h-4 text-warning" />
            <div>
              <p className="text-[10px] text-muted font-medium">Est. Duration</p>
              <p className="text-xs font-bold text-foreground">
                {isCompleted ? "N/A" : estimatedTime}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted font-medium">Confidence</p>
              <p className="text-xs font-bold text-foreground">
                {isCompleted ? "100%" : `${confidence}% Match`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            <div>
              <p className="text-[10px] text-muted font-medium">Score Projection</p>
              <p className="text-xs font-bold text-foreground">
                {isCompleted ? `${currentScore} Max` : `${currentScore} → ${nextScore}`}
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
            <span>Profile Ready</span>
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
