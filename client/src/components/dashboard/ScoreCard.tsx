"use client";

import React, { useState, useEffect } from "react";
import { useCareerStore } from "@/store/careerStore";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import Card from "@/components/ui/Card/Card";
import { TrendingUp } from "lucide-react";
import { careerService } from "@/services/career.service";

export const ScoreCard: React.FC = () => {
  const score = useCareerStore((state) => state.stats.score);
  const trend = useCareerStore((state) => state.user?.scoreTrend || 0);
  const readiness = useCareerStore((state) => state.stats.readiness);

  // Custom data plotting 30 days history + future predictions
  const richHistoryData = [
    { label: "W1", score: 62, milestone: "Profile setup", type: "past" },
    { label: "W2", score: 64, milestone: "GitHub Scan", type: "past" },
    { label: "W3", score: 65, milestone: "Resume Scan", type: "past" },
    { label: "W4", score: 70, milestone: "Mock interview", type: "past" },
    { label: "W5", score: 72, milestone: "Roadmap Complete", type: "past" },
    { label: "W6", score: score, milestone: "Current State", type: "past" },
    { label: "W7 (Est)", score: Math.min(100, score + 3), milestone: "Project Scored", type: "future" },
    { label: "W8 (Est)", score: Math.min(100, score + 6), milestone: "Interview Complete", type: "future" },
  ];

  const actualData = richHistoryData.map(d => d.type === "past" ? { ...d } : { ...d, score: null });
  const predictedData = richHistoryData.map(d => d.type === "future" || d.label === "W6" ? { ...d } : { ...d, score: null });

  // Circular progress calculations
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="flex flex-col items-center gap-6 p-6 h-full shadow-sm relative overflow-hidden">
      {/* Decorative glow overlay */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center gap-6 w-full z-10">
        {/* Left: Circular Score Circle */}
        <div className="relative flex items-center justify-center shrink-0 w-28 h-28">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-border fill-transparent"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-primary fill-transparent transition-all duration-500 ease-out"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-foreground">{score}</span>
            <span className="text-[10px] text-muted font-medium">/ 100</span>
          </div>
        </div>

        {/* Right: Trend Metrics & Sparkline Chart & Readiness Index */}
        <div className="flex-1 w-full min-w-0 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col justify-between h-full space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-muted">Career Score</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg font-bold text-foreground">Growing</span>
                <div className="flex items-center text-success text-[10px] font-semibold bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  <span>+{trend} this week</span>
                </div>
              </div>
            </div>

            {/* Sparkline chart with predicted line overlay */}
            <div className="h-16 w-full mt-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={richHistoryData}>
                  <YAxis domain={[50, 100]} hide />
                  {/* Past actual scores line */}
                  <Line
                    type="monotone"
                    data={actualData}
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1.5, fill: "#FFF" }}
                    activeDot={{ r: 5 }}
                  />
                  {/* Future predicted scores line */}
                  <Line
                    type="monotone"
                    data={predictedData}
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2.5, strokeWidth: 1, fill: "transparent", stroke: "var(--primary)" }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Milestone annotation items */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {richHistoryData.filter(d => d.type === "past" && d.milestone !== "Current State").slice(-3).map((d) => (
                <span key={d.label} className="text-[8px] bg-accent/20 border border-border px-1.5 py-0.5 rounded text-muted-foreground font-semibold">
                  ✓ {d.label}: {d.milestone}
                </span>
              ))}
              <span className="text-[8px] bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded text-primary font-semibold animate-pulse">
                🔮 W7 (Est): Project Scored
              </span>
            </div>
          </div>

          {/* Readiness Index */}
          <div className="space-y-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">
              Readiness Index
            </span>
            <div className="space-y-2.5">
              {[
                { label: "Job Readiness", val: readiness.jobReadiness },
                { label: "Resume ATS Match", val: readiness.resumeReadiness },
                { label: "Portfolio Grade", val: readiness.portfolioReadiness },
                { label: "Interview Confidence", val: readiness.interviewReadiness },
              ].map((idx) => (
                <div key={idx.label} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-foreground">{idx.label}</span>
                    <span className="text-primary">{idx.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                      style={{ width: `${idx.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Career Score Formula & Breakdown Matrix */}
      <div className="w-full border-t border-border/85 pt-4 mt-2">
        <span className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-2 px-1">
          Career Score Formula & Components Weights
        </span>
        <div className="grid grid-cols-5 gap-2 text-center text-[10px] bg-accent/5 border border-border/40 p-2.5 rounded-xl">
          <div className="space-y-1">
            <span className="text-muted block text-[8px] uppercase tracking-wide">Resume ATS</span>
            <span className="font-extrabold text-foreground">{readiness.resumeReadiness}</span>
            <span className="text-[8px] text-muted-foreground block">Weight: 20%</span>
          </div>
          <div className="space-y-1 border-l border-border/40">
            <span className="text-muted block text-[8px] uppercase tracking-wide">Projects Grade</span>
            <span className="font-extrabold text-foreground">{readiness.portfolioReadiness}</span>
            <span className="text-[8px] text-muted-foreground block">Weight: 25%</span>
          </div>
          <div className="space-y-1 border-l border-border/40">
            <span className="text-muted block text-[8px] uppercase tracking-wide">GitHub Audit</span>
            <span className="font-extrabold text-foreground">76</span>
            <span className="text-[8px] text-muted-foreground block">Weight: 15%</span>
          </div>
          <div className="space-y-1 border-l border-border/40">
            <span className="text-muted block text-[8px] uppercase tracking-wide">Interviews</span>
            <span className="font-extrabold text-foreground">{readiness.interviewReadiness}</span>
            <span className="text-[8px] text-muted-foreground block">Weight: 20%</span>
          </div>
          <div className="space-y-1 border-l border-border/40">
            <span className="text-muted block text-[8px] uppercase tracking-wide">Roadmap Track</span>
            <span className="font-extrabold text-foreground">{readiness.jobReadiness}</span>
            <span className="text-[8px] text-muted-foreground block">Weight: 20%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ScoreCard;
