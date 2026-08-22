"use client";

import React from "react";
import { TrendingUp, ArrowRight } from "lucide-react";
import { useCareerStore } from "@/store/careerStore";
import Link from "next/link";

export const IntelligenceHeader: React.FC = () => {
  const stats = useCareerStore((state) => state.stats);
  const user = useCareerStore((state) => state.user);
  const nextAction = stats?.nextAction;

  const score = stats?.score ?? 0;
  const trend = user?.scoreTrend ?? 0;
  const displayName = user?.name?.split(" ")[0] || "there";

  // Generate a dynamic summary based on actual user state
  const getSummary = () => {
    if (score === 0) return "Complete your Career DNA to start receiving personalized career intelligence.";
    if (score < 30) return "You're just getting started. Focus on building your foundation — upload your resume and connect GitHub.";
    if (score < 60) return "Good progress. Keep building momentum by completing your roadmap milestones and practicing interviews.";
    if (score < 80) return "Strong foundation in place. Focus on closing skill gaps and optimizing your application materials.";
    return "Excellent career readiness. You're well-positioned — focus on targeting specific opportunities.";
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted mb-1">
            Welcome back, <span className="text-foreground font-medium">{displayName}</span>
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">
            {getSummary()}
          </p>

          {/* Next Best Action inline */}
          {nextAction && (
            <Link
              href={
                nextAction.type === "resume" ? "/resume"
                  : nextAction.type === "github" ? "/portfolio"
                  : nextAction.type === "interview" ? "/interview"
                  : nextAction.type === "roadmap" ? "/roadmap"
                  : "/dashboard"
              }
              className="mt-3 inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline underline-offset-4 transition-colors"
            >
              <span>→ {nextAction.title}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Score + trend compact widget */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground tabular-nums">{score}</p>
            <p className="text-xs text-muted">Career Score</p>
          </div>
          {trend !== 0 && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
              trend > 0
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? "rotate-180" : ""}`} />
              {trend > 0 ? "+" : ""}{trend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceHeader;
