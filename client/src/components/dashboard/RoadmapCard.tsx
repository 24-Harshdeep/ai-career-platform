"use client";

import React from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import { Map, ArrowRight } from "lucide-react";
import Link from "next/link";

export const RoadmapCard: React.FC = () => {
  const roadmap = useCareerStore((state) => state.roadmap);

  return (
    <Card className="h-full flex flex-col justify-between p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center space-x-2">
            <Map className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Your Roadmap</h3>
          </div>
          <Link
            href="/roadmap"
            className="text-xs text-primary font-medium hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Modules */}
        <div className="space-y-5">
          {roadmap.map((track, idx) => {
            const skills = Array.isArray(track.modules)
              ? track.modules.flatMap((m) => m.subSkills?.map((s) => s.title) || [])
              : (track as any).skills || [];
            return (
              <div key={track.id || track.title || `track-${idx}`} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">{track.title}</span>
                  <span className="text-primary">{track.progress}%</span>
                </div>

                {/* Progress Track */}
                <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${track.progress}%` }}
                  />
                </div>

                {/* Skill Pills */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {skills.slice(0, 3).map((skill: string, sIdx: number) => (
                    <span
                      key={`${skill}-${sIdx}`}
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-accent/10 border border-border text-muted"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 3 && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded text-muted">
                      +{skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default RoadmapCard;
