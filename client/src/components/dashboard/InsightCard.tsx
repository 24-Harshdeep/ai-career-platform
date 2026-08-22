"use client";

import React from "react";
import Card from "@/components/ui/Card/Card";
import { Lightbulb, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCareerStore } from "@/store/careerStore";

export const InsightCard: React.FC = () => {
  const stats = useCareerStore((state) => state.stats);
  const readiness = stats?.readiness;

  // Find the weakest area from readiness scores to generate a real insight
  const getWeakestArea = () => {
    if (!readiness) return null;

    const areas = [
      { name: "Resume", score: readiness.resumeReadiness, href: "/resume", advice: "Upload and optimize your resume to improve your ATS match score." },
      { name: "Portfolio", score: readiness.portfolioReadiness, href: "/portfolio", advice: "Connect your GitHub and analyze your repositories to strengthen your portfolio." },
      { name: "Interview Skills", score: readiness.interviewReadiness, href: "/interview", advice: "Practice mock interviews to build confidence and identify knowledge gaps." },
    ];

    return areas.reduce((min, area) => area.score < min.score ? area : min, areas[0]);
  };

  const weakest = getWeakestArea();

  if (!weakest) {
    return (
      <Card className="h-full flex flex-col justify-center items-center p-6 text-center">
        <Lightbulb className="w-5 h-5 text-muted mb-2" />
        <p className="text-sm text-muted">Complete your Career DNA to receive personalized insights.</p>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col justify-between p-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-warning" />
          <h3 className="text-xs text-muted font-semibold uppercase tracking-wide">
            Focus Area
          </h3>
        </div>

        <div>
          <h4 className="text-base font-bold text-foreground">{weakest.name}</h4>
          <p className="text-xs text-muted mt-1">
            Readiness: <span className="text-foreground font-medium">{weakest.score}%</span>
          </p>
        </div>

        <p className="text-sm text-foreground/70 leading-relaxed">
          {weakest.advice}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-border">
        <Link
          href={weakest.href}
          className="text-sm text-primary font-medium hover:underline underline-offset-4 flex items-center gap-1.5 transition-colors"
        >
          <span>Improve {weakest.name}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};

export default InsightCard;
