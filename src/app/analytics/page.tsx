"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card/Card";
import Badge from "@/components/ui/Badge/Badge";
import { careerService } from "@/services/career.service";
import { useCareerStore } from "@/store/careerStore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { LineChart, Sparkles, TrendingUp, Calendar, Zap, Award } from "lucide-react";

export default function AnalyticsPage() {
  const score = useCareerStore((state) => state.user.score);
  const trend = useCareerStore((state) => state.user.scoreTrend);

  const [history, setHistory] = useState<{ week: string; score: number }[]>([]);
  const [skills, setSkills] = useState<{ skill: string; val: number }[]>([]);
  const [consistency, setConsistency] = useState<{ day: string; hours: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        const histData = await careerService.getScoreHistory();
        const skillData = await careerService.getSkillBreakdown();
        const consData = await careerService.getWeeklyConsistency();

        // Update last entry of history to match live store score
        const updatedHist = [...histData];
        if (updatedHist.length > 0) {
          updatedHist[updatedHist.length - 1] = {
            ...updatedHist[updatedHist.length - 1],
            score: score,
          };
        }

        setHistory(updatedHist);
        setSkills(skillData);
        setConsistency(consData);
      } catch (err) {
        console.error("Error loading analytics data", err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [score]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted font-semibold">Compiling metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Career Analytics</h2>
          <p className="text-xs text-muted">Track history logs, skill growth rates, and activity consistency details.</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Row 1: Line Area Chart - Score Growth */}
        <div className="lg:col-span-8">
          <Card className="p-6 h-full flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-muted">Career Score Progression</h3>
                  <p className="text-xl font-bold text-foreground mt-1">Growth Curve</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-foreground">{score}</span>
                  <p className="text-[10px] text-success font-bold flex items-center justify-end">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    <span>+{trend} this week</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="var(--muted)" fontSize={11} tickLine={false} />
                  <YAxis domain={["dataMin - 10", 100]} stroke="var(--muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Row 1 right: Skill Radar Chart */}
        <div className="lg:col-span-4">
          <Card className="p-6 h-full flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted">Skill DNA Distribution</h3>
              <p className="text-sm font-bold text-foreground mt-1">Relative Proficiency</p>
            </div>

            {/* Recharts Radar Chart */}
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skills}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="skill" stroke="var(--muted)" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke="var(--border)" />
                  <Radar
                    name="Skills"
                    dataKey="val"
                    stroke="var(--secondary)"
                    fill="var(--secondary)"
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2: Consistency Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <Card className="p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-muted">Learning Consistency</h3>
                  <p className="text-sm font-bold text-foreground mt-1">Weekly Hours Spent</p>
                </div>
                <Badge variant="warning">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  <span>Daily Commit logs</span>
                </Badge>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consistency} margin={{ left: -20 }}>
                  <XAxis dataKey="day" stroke="var(--muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Row 2 Right: Stats summary */}
        <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">AI Career Benchmarks</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Compared to developers pursuing Full Stack Developer roles, your profile stats rank:
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground font-medium">Frontend skills</span>
                <span className="text-success font-bold">Top 9%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground font-medium">Backend skills</span>
                <span className="text-warning font-bold">Top 38%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground font-medium">Weekly consistency</span>
                <span className="text-success font-bold">Top 15%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground font-medium">System design skills</span>
                <span className="text-red-500 font-bold">Bottom 22%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-warning" />
              <span className="text-xs text-foreground font-semibold">Priority improvement multiplier</span>
            </div>
            <span className="text-xs font-bold text-primary">System Design +5x</span>
          </div>
        </div>
      </div>
    </div>
  );
}
