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
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Dynamic Top Banner Summary */}
      <IntelligenceHeader />

      {/* Primary Analytics & AI Focus row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ScoreCard />
        </div>
        <div className="lg:col-span-5">
          <NextActionCard />
        </div>
      </div>

      {/* Core Career Tracks and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RoadmapCard />
        <MissionCard />
        <StreakCard />
      </div>

      {/* Shortcuts & Insight Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick actions box */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute right-0 bottom-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2">
            <h3 className="font-bold text-base text-foreground">Interactive AI Tools</h3>
            <p className="text-xs text-muted">
              Instantly review and optimize your credentials, practice interviews, and verify ATS matches.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <Link
              href="/interview"
              className="p-4 bg-accent/10 hover:bg-accent/20 border border-border hover:border-primary/50 text-center rounded-xl text-xs font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm"
            >
              AI Mock Interview
            </Link>
            <Link
              href="/resume"
              className="p-4 bg-accent/10 hover:bg-accent/20 border border-border hover:border-primary/50 text-center rounded-xl text-xs font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm"
            >
              Analyze Resume ATS
            </Link>
            <Link
              href="/dna"
              className="p-4 bg-accent/10 hover:bg-accent/20 border border-border hover:border-primary/50 text-center rounded-xl text-xs font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm"
            >
              Manage Career DNA
            </Link>
            <Link
              href="/applications"
              className="p-4 bg-accent/10 hover:bg-accent/20 border border-border hover:border-primary/50 text-center rounded-xl text-xs font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm"
            >
              Track Applications
            </Link>
          </div>
        </div>

        {/* Opportunity Card */}
        <div className="lg:col-span-4">
          <InsightCard />
        </div>
      </div>
    </div>
  );
}
