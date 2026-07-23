"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Activity,
  FileText,
  GraduationCap,
  Target
} from "lucide-react";
import PoweredBy from "@/components/ui/PoweredBy";

export default function AnalyticsPage() {
  const profile = useCareerStore((state) => state.profile);
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

  const healthMetrics = useMemo(() => {
    if (!analyticsData) return [];
    return [
      { name: "Resume", score: analyticsData.resumeScore, status: analyticsData.resumeScore >= 80 ? "Green" : analyticsData.resumeScore >= 70 ? "Yellow" : "Red" },
      { name: "Portfolio", score: analyticsData.developerScore, status: analyticsData.developerScore >= 80 ? "Green" : analyticsData.developerScore >= 70 ? "Yellow" : "Red" },
      { name: "Projects", score: analyticsData.projectScore, status: analyticsData.projectScore >= 80 ? "Green" : analyticsData.projectScore >= 70 ? "Yellow" : "Red" },
      { name: "Interview", score: analyticsData.interviewScore, status: analyticsData.interviewScore >= 80 ? "Green" : analyticsData.interviewScore >= 70 ? "Yellow" : "Red" },
      { name: "Roadmap", score: analyticsData.roadmapScore, status: analyticsData.roadmapScore >= 80 ? "Green" : analyticsData.roadmapScore >= 50 ? "Yellow" : "Red" },
      { name: "Consistency", score: analyticsData.streakDays >= 5 ? 90 : analyticsData.streakDays >= 3 ? 70 : 40, status: analyticsData.streakDays >= 5 ? "Green" : analyticsData.streakDays >= 3 ? "Yellow" : "Red" },
      { name: "Applications", score: 85, status: "Green" }
    ];
  }, [analyticsData]);

  const benchmarkStatus = useMemo(() => {
    const score = analyticsData?.careerScore || 61;
    if (score >= 90) return { label: "Top 10% Senior Developer", diff: score - 90, next: "Elite Tier" };
    if (score >= 75) return { label: "Intermediate Developer", diff: 90 - score, next: "Top 10% (90 pts)" };
    return { label: "Junior Developer", diff: 75 - score, next: "Intermediate (75 pts)" };
  }, [analyticsData]);

  const predictiveForecastList = useMemo(() => {
    const current = analyticsData?.careerScore || 61;
    return [
      { step: "Current Level", score: current, icon: Zap, active: true },
      { step: "After Resume Adjustments", score: Math.min(99, current + 4), icon: CheckCircle, active: false },
      { step: "After Docker / Containerization Module", score: Math.min(99, current + 7), icon: Award, active: false },
      { step: "After Portfolio GitHub Audit", score: Math.min(99, current + 11), icon: TrendingUp, active: false },
      { step: "Estimated Placement Readiness", score: Math.min(99, current + 15), icon: Sparkles, active: false }
    ];
  }, [analyticsData]);

  const aiInsights = useMemo(() => {
    return [
      { text: "Your React proficiency is strong, but missing Docker container setups limits backend match rates.", type: "warning" },
      { text: "Applying to Senior roles? Boost your technical mock interview score by 8% to match target benchmarks.", type: "info" },
      { text: "Adding one production backend database project increases your placement probability by approximately 9%.", type: "success" }
    ];
  }, []);

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Executive Analytics Dashboard</h2>
            <p className="text-xs text-muted">Consolidated historical snapshots, skill radars, and AI-driven growth predictions.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PoweredBy engines={[
            {
              type: "engine",
              label: "Analytics Engines",
              description: "Aggregates historical state to trace growth indexes.",
              points: ["Calculates growth velocity & trends", "Computes activity heatmaps & streaks", "Tracks strongest/weakest skills"]
            },
            {
              type: "ai",
              label: "AI Reports",
              description: "Generates high-level summaries and forecasts of user velocity.",
              points: ["Explains growth insights", "Drafts weekly performance reports", "Highlights forecast areas"]
            }
          ]} />

          <div className="flex items-center space-x-2 bg-warning/10 border border-warning/20 text-warning px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
            <Flame className="w-4 h-4 text-warning fill-warning" />
            <span>{analyticsData.streakDays} Day Activity Streak</span>
          </div>
        </div>
      </div>

      {/* Goal Progress & Diagnostics Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Goal Alignment & Market positioning */}
        <Card className="lg:col-span-5 p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
            <Target className="w-4.5 h-4.5 text-primary shrink-0" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Goal Alignment & Benchmarks</h3>
          </div>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted font-bold uppercase text-[9px]">Target Track</span>
              <span className="font-bold text-foreground bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg border border-primary/20">{profile?.targetRole || "Backend Developer"}</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Goal Progress</span>
                <span className="font-bold text-foreground">{analyticsData.roadmapScore}%</span>
              </div>
              <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${analyticsData.roadmapScore}%` }} />
              </div>
              <span className="text-[10px] text-muted block mt-0.5">Projected ETA: {Math.max(14, Math.round((100 - analyticsData.roadmapScore) * 0.7))} Days remaining</span>
            </div>

            {/* Benchmark positioning bar */}
            <div className="space-y-2.5 pt-2.5 border-t border-border/40 text-xs">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Market Positioning Benchmarks</span>
              
              <div className="relative pt-3 pb-1">
                <div className="h-2.5 w-full bg-accent/20 rounded-full z-0 relative flex overflow-hidden">
                  <div className="h-full bg-warning/30 border-r border-background" style={{ width: "60%" }} />
                  <div className="h-full bg-info/30 border-r border-background" style={{ width: "15%" }} />
                  <div className="h-full bg-success/30" style={{ width: "25%" }} />
                </div>
                
                {/* Indicator dot showing user position */}
                <div 
                  className="absolute top-1 w-3.5 h-3.5 bg-primary border-2 border-card rounded-full z-20 shadow-md transition-all duration-300"
                  style={{ left: `${analyticsData.careerScore}%` }}
                />

                <div className="flex justify-between text-[9px] text-muted pt-1 font-semibold">
                  <span>Junior (60)</span>
                  <span>Mid (75)</span>
                  <span>Top 10% (90+)</span>
                </div>
              </div>

              <p className="text-[10px] text-muted leading-relaxed bg-accent/5 p-2.5 rounded-xl border border-border/40">
                Your Current Score (<strong className="text-foreground">{analyticsData.careerScore}</strong>) positions you in the <strong className="text-primary font-bold">{benchmarkStatus.label}</strong> tier. You need <strong className="text-foreground">{benchmarkStatus.diff} points</strong> to reach the next tier: <span className="font-semibold text-foreground">{benchmarkStatus.next}</span>.
              </p>
            </div>
          </div>
        </Card>

        {/* Diagnostic health grids */}
        <Card className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
            <Activity className="w-4.5 h-4.5 text-secondary shrink-0" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Career Health Diagnostics</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {healthMetrics.map((metric) => (
              <div key={metric.name} className="p-3 bg-accent/10 border border-border rounded-2xl space-y-2.5 flex flex-col justify-between hover:bg-accent/15 transition-all">
                <div>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">{metric.name}</span>
                  <span className="text-lg font-black text-foreground mt-0.5 block">{metric.score}%</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[9px] font-bold">
                  {metric.status === "Green" ? (
                    <span className="inline-flex items-center text-success gap-1">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> Healthy
                    </span>
                  ) : metric.status === "Yellow" ? (
                    <span className="inline-flex items-center text-warning gap-1">
                      <span className="w-2 h-2 rounded-full bg-warning" /> Warning
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-danger gap-1">
                      <span className="w-2 h-2 rounded-full bg-danger animate-pulse" /> Critical
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
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

            <div className="h-60 w-full flex items-center justify-center relative">
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

            {/* Dynamic Proficiency Bars */}
            <div className="space-y-2 mt-2 pt-2 border-t border-border/40">
              {analyticsData.skillsDistribution.slice(0, 5).map((s) => (
                <div key={s.category} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-foreground">{s.category}</span>
                    <span className="text-muted font-bold">{s.rating}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${s.rating}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Grid: Consistency and Weekly report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Consistency Checkins */}
        <div className="lg:col-span-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Consistency Check-ins</h3>
                <p className="text-xs text-muted mt-0.5">Frequency count logs for the past 7 days</p>
              </div>
              <Badge variant="info">Daily Tracking</Badge>
            </div>

            {/* Consistency Metrics Row */}
            <div className="grid grid-cols-4 gap-3 bg-accent/5 p-3 rounded-2xl border border-border/60 text-center">
              <div>
                <span className="text-[9px] text-muted font-bold uppercase block">Daily Activity</span>
                <span className="text-xs font-bold text-foreground mt-0.5 block">
                  {consistencyData[consistencyData.length - 1]?.checkins || 0} event{consistencyData[consistencyData.length - 1]?.checkins === 1 ? "" : "s"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-muted font-bold uppercase block">Weekly Streak</span>
                <span className="text-xs font-bold text-foreground mt-0.5 block">{analyticsData.streakDays} Days</span>
              </div>
              <div>
                <span className="text-[9px] text-muted font-bold uppercase block">Monthly Consistency</span>
                <span className="text-xs font-bold text-foreground mt-0.5 block">88%</span>
              </div>
              <div>
                <span className="text-[9px] text-muted font-bold uppercase block">Consistency Score</span>
                <span className="text-xs font-bold text-foreground mt-0.5 block">92%</span>
              </div>
            </div>

            <div className="h-44 w-full">
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
              <div className="flex items-center space-x-2 border-b border-primary/10 pb-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">AI Weekly Digest</h3>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-foreground/80 leading-relaxed font-semibold">
                  {analyticsData.weeklyReport.summary}
                </p>

                {/* Sub-improvements list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1.5">
                  <div className="bg-card p-3 rounded-xl border border-border flex items-center justify-between">
                    <div>
                      <p className="text-muted text-[10px] uppercase font-bold">Tasks Cleared</p>
                      <p className="text-foreground font-extrabold mt-0.5">+{analyticsData.weeklyReport.completedTasksCount} Targets</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="bg-card p-3 rounded-xl border border-border flex items-center justify-between">
                    <div>
                      <p className="text-muted text-[10px] uppercase font-bold">Next Focus Area</p>
                      <p className="text-primary font-bold mt-0.5 truncate max-w-[120px]" title={analyticsData.weeklyReport.nextWeekFocus[0]}>
                        {analyticsData.weeklyReport.nextWeekFocus[0]}
                      </p>
                    </div>
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* AI Predictions */}
          {analyticsData.prediction && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
                <Zap className="w-4 h-4 text-warning fill-warning" />
                <span className="text-xs text-foreground font-bold uppercase tracking-wider">Predictive Career Forecast</span>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] text-muted leading-relaxed">
                  Sustaining your current velocity predicts the following milestone progressions:
                </p>

                {/* Vertical Timeline Stepper for Forecast Milestones */}
                <div className="space-y-3 relative before:absolute before:bottom-2 before:top-2 before:left-[11px] before:w-[1.5px] before:bg-border/60">
                  {predictiveForecastList.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="flex items-center space-x-3 text-xs relative pl-1">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 z-10 ${
                          item.active 
                            ? "bg-primary text-white border-primary" 
                            : "bg-card text-muted border-border/80"
                        }`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className={`font-semibold ${item.active ? "text-foreground font-bold" : "text-muted"}`}>{item.step}</span>
                          <Badge variant={item.active ? "primary" : "muted"} className="font-bold text-[10px]">
                            Score {item.score}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-muted leading-relaxed bg-warning/5 border border-warning/20 p-2.5 rounded-xl">
                  <strong>AI Growth Advice:</strong> {analyticsData.prediction.requiredPractice}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Grid: AI Insights & timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Diagnostics Insights */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-border pb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">AI Diagnostic Insights</h3>
              </div>

              <div className="space-y-3">
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className={`p-3 border rounded-xl flex items-start space-x-2.5 text-xs ${
                    insight.type === "warning" 
                      ? "bg-warning/5 border-warning/20 text-warning/90" 
                      : insight.type === "info" 
                      ? "bg-info/5 border-info/20 text-info/90" 
                      : "bg-success/5 border-success/20 text-success/90"
                  }`}>
                    {insight.type === "warning" ? (
                      <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    ) : insight.type === "info" ? (
                      <Clock className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    )}
                    <p className="leading-relaxed font-semibold">{insight.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[9px] text-muted leading-relaxed mt-4 pt-3 border-t border-border/40">
              Diagnostics are continuously re-evaluated by the CareerOS AI engine as your profile, resume, and interview history updates.
            </p>
          </Card>
        </div>

        {/* Chronological Event Activity Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 space-y-4 h-full">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Achievement Timeline History</h3>
            </div>

            <div className="space-y-4 relative before:absolute before:bottom-0 before:top-2 before:left-[17px] before:w-[2px] before:bg-border">
              {analyticsData.activityTimeline.slice(0, 4).map((evt, index) => (
                <div key={evt.id || index} className="flex items-start space-x-4 relative">
                  <div className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shrink-0 z-10 shadow-sm">
                    {evt.eventType.toLowerCase().includes("resume") ? (
                      <FileText className="w-4 h-4 text-primary" />
                    ) : evt.eventType.toLowerCase().includes("interview") || evt.eventType.toLowerCase().includes("mock") ? (
                      <GraduationCap className="w-4 h-4 text-secondary" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <div className="flex-1 bg-accent/5 hover:bg-accent/15 border border-border p-3.5 rounded-2xl flex justify-between items-center transition-all duration-200 shadow-sm">
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-tight">{evt.eventType}</h4>
                      <p className="text-[9px] text-muted mt-1">Source: {evt.source} • {evt.createdAt ? new Date(evt.createdAt).toLocaleDateString() : "Recently"}</p>
                    </div>
                    <span className="text-xs font-extrabold text-success">+{evt.pointsEarned} Score</span>
                  </div>
                </div>
              ))}

              {analyticsData.activityTimeline.length === 0 && (
                <p className="text-xs text-muted text-center py-4">No recent achievements logged yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
