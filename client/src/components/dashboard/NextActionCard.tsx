"use client";

import React, { useState } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import { Brain, Sparkles, Check, Hourglass, Zap, ShieldCheck } from "lucide-react";

export const NextActionCard: React.FC = () => {
  const action = useCareerStore((state) => state.stats.nextAction);
  const currentScore = useCareerStore((state) => state.stats.score);
  const [loading, setLoading] = useState(false);

  const handleStartTask = async () => {
    if (!action) return;
    setLoading(true);
    const type = (action.type || "").toLowerCase();
    const title = (action.title || "").toLowerCase();

    const target = action.targetUrl || (
      type === "resume" || title.includes("resume") ? "/resume"
        : type === "github" || type === "project" || type === "portfolio" || title.includes("github") || title.includes("portfolio") || title.includes("project") ? "/portfolio"
        : type === "interview" || title.includes("interview") ? "/interview"
        : type === "roadmap" || title.includes("roadmap") ? "/roadmap"
        : type === "application" || type === "applications" || title.includes("application") || title.includes("job") ? "/applications"
        : "/dna"
    );
    window.location.href = target;
    setLoading(false);
  };

  // Fallbacks if data has not loaded from backend yet
  const title = action?.title;
  const reason = action?.reason;
  const impact = action?.impact;
  const estimatedTime = action?.estimatedTime || action?.duration;
  const confidence = action?.confidence || 95;
  const nextScore = action?.careerScoreAfterCompletion || (currentScore ? Math.min(100, currentScore + (impact || 3)) : null);

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
            AI Next Best Action
          </h3>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-foreground leading-tight">
            {title || "Complete Career DNA Baseline"}
          </h4>
          <p className="text-xs text-muted leading-relaxed">
            {reason || "Set your target role and upload a resume to receive your personalized high-impact career recommendation."}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-success" />
            <div>
              <p className="text-[10px] text-muted font-medium">Expected Impact</p>
              <p className="text-xs font-bold text-success">
                {impact == null ? "High" : `+${impact} Career Score`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Hourglass className="w-4 h-4 text-warning" />
            <div>
              <p className="text-[10px] text-muted font-medium">Est. Duration</p>
              <p className="text-xs font-bold text-foreground">
                {estimatedTime || "15 mins"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted font-medium">Match Confidence</p>
              <p className="text-xs font-bold text-foreground">
                {confidence == null ? "High" : `${confidence}% Match`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            <div>
              <p className="text-[10px] text-muted font-medium">Score Projection</p>
              <p className="text-xs font-bold text-foreground">
                {nextScore == null ? "Growing" : `${currentScore} → ${nextScore}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Button Action */}
      <div className="mt-6">
        <Button
          variant="ai"
          className="w-full text-sm font-semibold cursor-pointer"
          onClick={handleStartTask}
          isLoading={loading}
        >
          Execute Next Action
        </Button>
      </div>
    </Card>
  );
};

export default NextActionCard;
