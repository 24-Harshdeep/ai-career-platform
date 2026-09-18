"use client";

import React from "react";
import Link from "next/link";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import IntelligenceHeader from "@/components/dashboard/IntelligenceHeader";
import ScoreCard from "@/components/dashboard/ScoreCard";
import NextActionCard from "@/components/dashboard/NextActionCard";
import RoadmapCard from "@/components/dashboard/RoadmapCard";
import MissionCard from "@/components/dashboard/MissionCard";
import StreakCard from "@/components/dashboard/StreakCard";
import InsightCard from "@/components/dashboard/InsightCard";

import { useCareerStore } from "@/store/careerStore";

export default function DashboardPage() {
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <StaggerItem>
        <IntelligenceHeader />
      </StaggerItem>

      {/* Score + Next Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <StaggerItem className="lg:col-span-7">
          <ScoreCard />
        </StaggerItem>
        <StaggerItem className="lg:col-span-5">
          <NextActionCard />
        </StaggerItem>
      </div>

      {/* Progress Tracks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StaggerItem>
          <RoadmapCard />
        </StaggerItem>
        <StaggerItem>
          <MissionCard />
        </StaggerItem>
        <StaggerItem>
          <StreakCard />
        </StaggerItem>
      </div>

      {/* Quick Actions + Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <StaggerItem className="lg:col-span-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="space-y-1 mb-5">
              <h3 className="font-semibold text-sm text-foreground">Quick Actions</h3>
              <p className="text-xs text-muted">
                Jump to key workflows across your career platform.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Upload Resume", href: "/resume" },
                { label: "Add Opportunity", href: "/applications" },
                { label: "Analyze GitHub", href: "/portfolio" },
                { label: "Mock Interview", href: "/interview" },
                { label: "Weekly Plan", href: "/roadmap" },
                { label: "Skill Gaps", href: "/dna" },
                { label: "Ask Coach", href: "/coach" },
                { label: "View Telemetry", href: "/dna?tab=analytics" },
              ].map((tool) => (
                <Link
                  key={tool.label}
                  href={tool.href}
                  className="p-3 bg-accent/30 hover:bg-accent/50 border border-transparent hover:border-border text-center rounded-lg text-xs font-medium text-foreground transition-all duration-200 cursor-pointer"
                >
                  {tool.label}
                </Link>
              ))}
            </div>
          </div>
        </StaggerItem>

        <StaggerItem className="lg:col-span-4">
          <InsightCard />
        </StaggerItem>
      </div>
    </PageTransition>
  );
}
