"use client";

import React from "react";
import Link from "next/link";
import IntelligenceHeader from "@/components/dashboard/IntelligenceHeader";
import ScoreCard from "@/components/dashboard/ScoreCard";
import NextActionCard from "@/components/dashboard/NextActionCard";
import RoadmapCard from "@/components/dashboard/RoadmapCard";
import MissionCard from "@/components/dashboard/MissionCard";
import StreakCard from "@/components/dashboard/StreakCard";
import InsightCard from "@/components/dashboard/InsightCard";
import { Sparkles, ArrowRight } from "lucide-react";

import { useCareerStore } from "@/store/careerStore";

export default function DashboardPage() {
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Top Banner Summary */}
      <div className="animate-fade-in-up animate-delay-0">
        <IntelligenceHeader />
      </div>

      {/* Live AI Alert Notifications Feed */}
      <div className="animate-fade-in-up bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-center justify-between text-xs text-foreground shadow-sm" style={{ animationDelay: "75ms" }}>
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="font-semibold text-primary">Live OS Alert:</span>
          <span className="text-muted-foreground">Your ATS increased by 8% after your latest resume upload. Interview readiness improved because you completed API Authentication.</span>
        </div>
        <span className="text-[10px] text-muted font-semibold bg-accent/20 px-2.5 py-0.5 rounded-full shrink-0">
          Sync Dynamic
        </span>
      </div>

      {/* Primary Analytics & AI Focus row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <ScoreCard />
        </div>
        <div className="lg:col-span-5 animate-fade-in-up" style={{ animationDelay: "225ms" }}>
          <NextActionCard />
        </div>
      </div>

      {/* Core Career Tracks and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <RoadmapCard />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "375ms" }}>
          <MissionCard />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "450ms" }}>
          <StreakCard />
        </div>
      </div>

      {/* Shortcuts & Insight Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick actions box */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "525ms" }}>
          {/* Subtle background glow */}
          <div className="absolute right-0 bottom-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2">
            <h3 className="font-bold text-base text-foreground">Interactive AI Tools</h3>
            <p className="text-xs text-muted">
              Instantly review and optimize your credentials, practice interviews, and verify ATS matches.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Upload Resume", href: "/resume" },
              { label: "Paste Job Desc", href: "/applications" },
              { label: "Analyze GitHub", href: "/portfolio" },
              { label: "Start Mock Interview", href: "/interview" },
              { label: "Generate Weekly Plan", href: "/coach?from=/roadmap" },
              { label: "Find Missing Skills", href: "/coach?from=/dna" },
              { label: "Explain Career Score", href: "/coach?from=/dashboard" },
              { label: "Optimize Portfolio", href: "/portfolio" },
            ].map((tool) => (
              <Link
                key={tool.label}
                href={tool.href}
                className="p-3.5 bg-accent/10 hover:bg-accent/20 border border-border hover:border-primary/50 text-center rounded-xl text-xs font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm"
              >
                {tool.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Opportunity Card */}
        <div className="lg:col-span-4 animate-fade-in-up" style={{ animationDelay: "600ms" }}>
          <InsightCard />
        </div>
      </div>
    </div>
  );
}
