"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import {
  FileText,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  FileSearch,
  Sparkles,
  Zap,
  Hourglass,
  Layout,
  Gauge
} from "lucide-react";
import PoweredBy from "@/components/ui/PoweredBy";

export default function ResumePage() {
  const resumeAnalysis = useCareerStore((state) => state.resumeAnalysis);
  const fetchResumeAnalysis = useCareerStore((state) => state.fetchResumeAnalysis);
  const uploadResume = useCareerStore((state) => state.uploadResume);
  const addNotification = useCareerStore((state) => state.addNotification);

  const [scanState, setScanState] = useState<"idle" | "scanning" | "completed">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial analysis from database on mount
  useEffect(() => {
    fetchResumeAnalysis();
  }, [fetchResumeAnalysis]);

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanState("scanning");
    setScanProgress(0);

    let currentProgress = 0;
    const interval = setInterval(async () => {
      currentProgress += 20;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setScanProgress(100);

        try {
          await uploadResume(file);
          setScanState("completed");
          addNotification("Resume uploaded, saved to Cloudinary, and analyzed successfully!", "success");
        } catch (err) {
          console.error(err);
          setScanState("idle");
          addNotification("Failed to analyze resume. Make sure it is a valid PDF.", "warning");
        }
      } else {
        setScanProgress(currentProgress);
      }
    }, 150);
  };

  const score = resumeAnalysis ? resumeAnalysis.atsScore : 82;
  
  // Breakdown fallbacks if analysis is empty
  const breakdown = resumeAnalysis ? resumeAnalysis.breakdown : {
    keywords: 90,
    projects: 75,
    skills: 88,
    formatting: 95,
    actionVerbs: 68,
    quantifiedImpact: 60
  };

  const missingKeywordsList = resumeAnalysis ? resumeAnalysis.missingKeywords : [
    { keyword: "Docker", importance: "High", reason: "Core capability identified in 82% of target developer screening loops.", expectedScoreGain: 2, expectedReadinessGain: 4 },
    { keyword: "CI/CD Pipelines", importance: "Medium", reason: "Frequently required for backend deployments.", expectedScoreGain: 1, expectedReadinessGain: 2 }
  ];

  const suggestedImprovementsList = resumeAnalysis ? resumeAnalysis.suggestedImprovements : [
    "Incorporate missing technical skills highlighted in keyword analysis.",
    "Add concrete metrics (e.g. 'boosted performance by 40%') to quantify achievements."
  ];

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Resume Intelligence</h2>
            <p className="text-xs text-muted">ATS analysis, parser checks, and optimization suggestions.</p>
          </div>
        </div>
        <PoweredBy engines={[
          {
            type: "user",
            label: "User Document",
            description: "Allows the user to upload their resume text or document.",
            points: ["Resume PDF / TXT uploads"]
          },
          {
            type: "engine",
            label: "Resume Engines",
            description: "Backend engines parsing and grading the credentials.",
            points: ["PDF Text parser", "ATS Score calculation engine", "Keyword matcher engine", "Formatting checking engine"]
          },
          {
            type: "ai",
            label: "AI Optimizer",
            description: "Uses LLMs to re-draft and optimize your qualifications.",
            points: ["Generates bullet point enhancements", "Identifies missing high-impact keywords", "Drafts resume optimizations"]
          }
        ]} />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: ATS Score & Upload */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 flex flex-col items-center text-center space-y-6">
            <h3 className="text-sm font-semibold text-muted">Overall Resume Score</h3>

            {/* Score Ring */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className="stroke-border fill-transparent"
                  strokeWidth="8"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className="stroke-primary fill-transparent transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 - (score / 100) * (2 * Math.PI * 56)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold text-foreground">{score}%</span>
                <span className="text-[10px] text-success font-bold mt-0.5">
                  {score >= 85 ? "Excellent" : (score >= 70 ? "Good" : "Needs Work")}
                </span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="w-full border-t border-border pt-4 text-left">
              <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">ATS Score Breakdown</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="flex justify-between border-b border-border/50 pb-1">
                  <span className="text-xs text-muted">Keywords Match</span>
                  <span className="text-xs font-bold text-foreground">{breakdown.keywords}%</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1">
                  <span className="text-xs text-muted">Project Audit</span>
                  <span className="text-xs font-bold text-foreground">{breakdown.projects}%</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1">
                  <span className="text-xs text-muted">Skills Inventory</span>
                  <span className="text-xs font-bold text-foreground">{breakdown.skills}%</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1">
                  <span className="text-xs text-muted">Formatting Check</span>
                  <span className="text-xs font-bold text-foreground">{breakdown.formatting}%</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1">
                  <span className="text-xs text-muted">Action Verbs</span>
                  <span className="text-xs font-bold text-foreground">{breakdown.actionVerbs}%</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1">
                  <span className="text-xs text-muted">Quantified Impact</span>
                  <span className="text-xs font-bold text-foreground">{breakdown.quantifiedImpact}%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Upload/Scanner Box */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Re-scan Credentials</h3>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt"
              className="hidden"
            />

            {scanState === "idle" && (
              <button
                onClick={handleBoxClick}
                className="w-full border-2 border-dashed border-border hover:border-primary/50 bg-accent/5 hover:bg-accent/15 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 cursor-pointer group transition-all duration-200"
              >
                <div className="p-3 bg-card border border-border rounded-xl group-hover:scale-105 transition-transform duration-200 shadow-sm">
                  <UploadCloud className="w-6 h-6 text-muted group-hover:text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground">Click to upload new resume</p>
                  <p className="text-[10px] text-muted mt-1">PDF or DOCX (Max 5MB)</p>
                </div>
              </button>
            )}

            {scanState === "scanning" && (
              <div className="border border-border bg-accent/10 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4">
                <FileSearch className="w-10 h-10 text-primary animate-pulse" />
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted">
                    <span>Scanning sections...</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {scanState === "completed" && (
              <div className="border border-success/20 bg-success/5 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 text-center">
                <CheckCircle className="w-10 h-10 text-success" />
                <div>
                  <p className="text-xs font-bold text-success">Scan Complete!</p>
                  <p className="text-[10px] text-muted mt-1">
                    Document matches target configurations. Score: {score}%.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setScanState("idle")}>
                  Upload Another File
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Missing Keywords & Suggestions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Missing Keywords Details */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">ATS Missing Keywords</h3>
            <div className="space-y-4">
              {missingKeywordsList.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-accent/10 border border-border rounded-2xl relative"
                >
                  <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-foreground">{skill.keyword}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          skill.importance === "High"
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : "bg-warning/10 border-warning/20 text-warning"
                        }`}
                      >
                        {skill.importance} Priority
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{skill.reason}</p>
                    <div className="flex gap-4 mt-2 text-[10px] font-medium">
                      <span className="text-success flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>+{skill.expectedScoreGain} Score</span>
                      </span>
                      <span className="text-primary flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        <span>+{skill.expectedReadinessGain}% Readiness</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actionable Improvement Suggestions */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Suggested Formatting Optimization</h3>
              </div>
              <Badge variant="ai">System Version v1.0.0</Badge>
            </div>

            <ul className="space-y-2 text-xs text-muted list-disc list-inside leading-relaxed">
              {suggestedImprovementsList.map((imp, idx) => (
                <li key={idx} className="marker:text-primary">
                  {imp}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
