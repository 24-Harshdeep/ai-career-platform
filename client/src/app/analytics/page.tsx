"use client";

import React, { useEffect, useState } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Badge from "@/components/ui/Badge/Badge";
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
import {
  LineChart,
  Sparkles,
  TrendingUp,
  Calendar,
  Zap,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Flame,
  Activity
} from "lucide-react";

export default function AnalyticsPage() {
  const analyticsData = useCareerStore((state) => state.analyticsData);
  const fetchAnalyticsDashboard = useCareerStore((state) => state.fetchAnalyticsDashboard);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await fetchAnalyticsDashboard();
      setLoading(false);
    };
    load();
  }, [fetchAnalyticsDashboard]);

  if (loading || !analyticsData) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted font-semibold">Compiling Executive Metrics...</span>
        </div>
      </div>
    );
  }

  // Format trend line history
  const historyData = [
    { week: "Wk 1", score: analyticsData.careerScore - 8 },
    { week: "Wk 2", score: analyticsData.careerScore - 5 },
    { week: "Wk 3", score: analyticsData.careerScore - 2 },
    { week: "Wk 4", score: analyticsData.careerScore },
  ];

  // Consistency heatmap formatting
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const consistencyData = analyticsData.heatMapDays.map((val, idx) => ({
    day: daysOfWeek[idx] || "Day",
    checkins: val
  }));

  // Recharts Radar formatting
  const radarData = analyticsData.skillsDistribution.map(s => ({
    skill: s.category,
    val: s.rating
  }));

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Executive Analytics Dashboard</h2>
            <p className="text-xs text-muted">Consolidated historical snapshots, skill radars, and AI-driven growth predictions.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-warning/10 border border-warning/20 text-warning px-3 py-1.5 rounded-xl text-xs font-bold">
          <Flame className="w-4 h-4 text-warning fill-warning" />
          <span>{analyticsData.streakDays} Day Activity Streak</span>
        </div>
      </div>

      {/* Grid: Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Growth Curve Chart */}
        <div className="lg:col-span-8">
          <Card className="p-6 h-full flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-muted">Career Score Progression</h3>
                <p className="text-xl font-bold text-foreground mt-1">Growth Velocity Curve</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-foreground">{analyticsData.careerScore}</span>
                <p className="text-[10px] text-success font-bold flex items-center justify-end mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  <span>+{analyticsData.weeklyGrowth} points (7d)</span>
                </p>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ left: -25, right: 10 }}>
                  <defs>
                    <linearGradient id="colorScoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="var(--muted)" fontSize={11} tickLine={false} />
                  <YAxis domain={[50, 100]} stroke="var(--muted)" fontSize={11} tickLine={false} />
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
                    fill="url(#colorScoreGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Skill radar Proficiency */}
        <div className="lg:col-span-4">
          <Card className="p-6 h-full flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted">Skills Matrix Distribution</h3>
              <p className="text-sm font-bold text-foreground mt-1">Strengths Balance Radar</p>
            </div>

            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="skill" stroke="var(--muted)" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke="var(--border)" />
                  <Radar
                    name="Skills Rating"
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

      {/* Grid: Consistency and Weekly report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Consistency Checkins */}
        <div className="lg:col-span-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Consistency Check-ins</h3>
                <p className="text-xs text-muted mt-0.5">Frequency count logs for the past 7 days</p>
              </div>
              <Badge variant="info">Daily Tracking</Badge>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consistencyData} margin={{ left: -25 }}>
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
                  <Bar dataKey="checkins" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right: AI Digest Report & Predictions */}
        <div className="lg:col-span-6 space-y-6">
          {/* AI Weekly Report */}
          {analyticsData.weeklyReport && (
            <Card className="p-6 space-y-4 border-primary/20 bg-accent/5">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">AI Weekly Digest</h3>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed font-semibold">
                {analyticsData.weeklyReport.summary}
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div className="bg-card p-3 rounded-xl border border-border">
                  <p className="text-muted text-[10px] uppercase font-bold">Tasks Cleared</p>
                  <p className="text-foreground font-extrabold mt-0.5">+{analyticsData.weeklyReport.completedTasksCount} Targets</p>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border">
                  <p className="text-muted text-[10px] uppercase font-bold">Next Focus Areas</p>
                  <p className="text-primary font-bold mt-0.5 truncate">{analyticsData.weeklyReport.nextWeekFocus[0]}</p>
                </div>
              </div>
            </Card>
          )}

          {/* AI Predictions */}
          {analyticsData.prediction && (
            <Card className="p-6 space-y-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-warning fill-warning" />
                <span className="text-xs text-foreground font-bold uppercase tracking-wider">Predictive Career Forecast</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted leading-relaxed">
                  If you sustain your current velocity check-in rates:
                </p>
                <p className="text-sm font-bold text-foreground">
                  Expected Career Score: <span className="text-primary font-extrabold text-base">{analyticsData.prediction.targetScore}</span> within {analyticsData.prediction.daysRemaining} days.
                </p>
              </div>
              <p className="text-[11px] text-muted italic bg-accent/10 p-2.5 rounded-xl border border-border leading-relaxed">
                <strong>Recommended:</strong> {analyticsData.prediction.requiredPractice}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Grid: Achievements & Activity timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Unlocked Milestones Achievements */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 space-y-4 h-full">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Award className="w-5 h-5 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Unlocked Achievements</h3>
            </div>

            {analyticsData.achievements.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No milestone achievements unlocked yet.</p>
            ) : (
              <div className="space-y-3.5">
                {analyticsData.achievements.map((ach, index) => (
                  <div key={`${ach.id}-${index}`} className="flex items-start space-x-3.5 p-3.5 bg-accent/5 hover:bg-accent/15 border border-border rounded-2xl transition-all duration-200 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground leading-tight">{ach.title}</h4>
                      <p className="text-[10px] text-muted leading-relaxed">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Chronological Event Activity Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 space-y-4 h-full">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Activity History Timeline</h3>
            </div>

            {analyticsData.activityTimeline.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No events logged in the current cycle.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:bottom-0 before:top-2 before:left-[17px] before:w-[2px] before:bg-border">
                {analyticsData.activityTimeline.map((evt, index) => (
                  <div key={`${evt.id}-${index}`} className="flex items-start space-x-4 relative">
                    <div className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shrink-0 z-10">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex-1 bg-accent/5 hover:bg-accent/15 border border-border p-3.5 rounded-2xl flex justify-between items-center transition-all duration-200 shadow-sm">
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-tight">{evt.eventType}</h4>
                        <p className="text-[9px] text-muted mt-1">Source: {evt.source}</p>
                      </div>
                      <span className="text-xs font-extrabold text-success">+{evt.pointsEarned} Score</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
