"use client";

import React from "react";
import { Sparkles, Brain } from "lucide-react";
import PoweredBy from "@/components/ui/PoweredBy";

export const IntelligenceHeader: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent border border-primary/20 rounded-2xl p-6 relative overflow-hidden mb-6 shadow-md ai-glow-pulse">
      {/* Decorative Blur Spheres */}
      <div className="absolute -right-20 -top-20 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-primary/20 rounded-xl border border-primary/30 text-primary mt-1 shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-primary tracking-wider uppercase font-semibold">
                AI Career Intelligence
              </span>
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-ping" />
            </div>
            <h2 className="text-xl font-bold mt-1 text-foreground">
              Your Career Intelligence Summary
            </h2>
            <p className="text-sm text-foreground/80 font-medium mt-1 leading-relaxed">
              "Your frontend skills are exceptionally strong. Your biggest immediate opportunity is{" "}
              <span className="text-secondary font-semibold">backend architecture</span>."
            </p>
            <p className="text-xs text-primary font-bold mt-2.5 leading-relaxed bg-primary/10 border border-primary/20 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm max-w-2xl">
              <span>💡</span>
              <span>Your next best step today is optimizing your resume for backend roles. Completing this task could increase your ATS score by approximately 3 points and improve your interview readiness.</span>
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex flex-col items-end shrink-0 gap-2">
          <div className="flex flex-col items-end bg-card/60 backdrop-blur-md border border-border px-4 py-2.5 rounded-xl md:text-right w-full sm:w-auto shadow-sm">
            <div className="flex items-center space-x-1.5 justify-end">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-muted font-medium">AI Confidence</span>
            </div>
            <span className="text-lg font-bold text-foreground mt-0.5">87%</span>
            <span className="text-[9px] text-muted-foreground mt-1 max-w-[155px] text-right leading-normal block">
              Based on Resume, GitHub, Roadmap, and Interview logs.
            </span>
          </div>
          <PoweredBy engines={[
            {
              type: "user",
              label: "User Data",
              description: "Tracks progress directly updated by user actions.",
              points: ["Learning progress", "Completed missions", "Uploaded resume"]
            },
            {
              type: "engine",
              label: "Career Intelligence Engine",
              description: "Our proprietary scoring and statistics calculator.",
              points: ["Career Score", "Readiness Indexes", "Weekly statistics & Growth velocity"]
            },
            {
              type: "ai",
              label: "AI Coach",
              description: "Specialized coaching models providing synthesis and recommendations.",
              points: ["Weekly performance summary", "Personalized insights", "Next action suggestions"]
            },
            {
              type: "api",
              label: "External Integrations",
              description: "Syncs information from developer networks and file providers.",
              points: ["GitHub statistics & repository checks", "Cloudinary resume storage"]
            }
          ]} />
        </div>
      </div>
    </div>
  );
};

export default IntelligenceHeader;
