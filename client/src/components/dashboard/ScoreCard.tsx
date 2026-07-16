"use client";

import React, { useState, useEffect } from "react";
import { useCareerStore } from "@/store/careerStore";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import Card from "@/components/ui/Card/Card";
import { TrendingUp } from "lucide-react";
import { careerService } from "@/services/career.service";

export const ScoreCard: React.FC = () => {
  const score = useCareerStore((state) => state.stats.score);
  const trend = useCareerStore((state) => state.user.scoreTrend);
  const readiness = useCareerStore((state) => state.stats.readiness);

  const [historyData, setHistoryData] = useState<{ week: string; score: number }[]>([]);

  // Load history data from the service layer
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await careerService.getScoreHistory();
        // Append the current score to the end of the history array to show live updates
        const updatedData = [...data];
        if (updatedData.length > 0) {
          updatedData[updatedData.length - 1] = {
            ...updatedData[updatedData.length - 1],
            score: score,
          };
        }
        setHistoryData(updatedData);
      } catch (err) {
        console.error("Error loading score history", err);
      }
    };
    fetchHistory();
  }, [score]);

  // Circular progress calculations
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="flex flex-col md:flex-row items-center gap-6 p-6 h-full">
      {/* Left: Circular Score Circle */}
      <div className="relative flex items-center justify-center shrink-0 w-28 h-28">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background track circle */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            className="stroke-border fill-transparent"
            strokeWidth={strokeWidth}
          />
          {/* Active progress circle */}
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
            <h3 className="text-sm font-semibold text-muted">Career Score</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xl font-bold text-foreground">Growing</span>
              <div className="flex items-center text-success text-xs font-semibold bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                <span>+{trend} this week</span>
              </div>
            </div>
          </div>

          {/* Mini sparkline chart using Recharts */}
          <div className="h-12 w-full mt-2">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <YAxis domain={["dataMin - 10", "dataMax + 10"]} hide />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-accent/20 rounded-lg animate-pulse" />
            )}
          </div>
        </div>

        {/* Readiness Index from readinessEngine */}
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
    </Card>
  );
};

export default ScoreCard;
