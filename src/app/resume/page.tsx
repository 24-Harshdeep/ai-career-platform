"use client";

import React, { useState } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import {
  FileText,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  FileSearch,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function ResumePage() {
  const addNotification = useCareerStore((state) => state.addNotification);
  const updateScore = useCareerStore((state) => state.updateScore);

  const [scanState, setScanState] = useState<"idle" | "scanning" | "completed">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [score, setScore] = useState(82);

  const missingSkills = [
    { name: "Docker", reason: "Required in 68% of backend job listings matching your goal." },
    { name: "CI/CD & Testing", reason: "Found in 42% of intermediate roles. Add Jest, Cypress, or GitHub Actions." },
    { name: "AWS / Cloud Deployment", reason: "Missing cloud environment exposure in active project bullet points." },
  ];

  const handleMockUpload = () => {
    if (scanState === "scanning") return;

    setScanState("scanning");
    setScanProgress(0);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setScanProgress(100);
        setScanState("completed");
        setScore(86); // Score increases after optimize/scan
        updateScore(2); // Give +2 points for uploading and scanning resume
        addNotification("Resume scanned successfully! ATS compatibility increased to 86%.", "success");
      } else {
        setScanProgress(currentProgress);
      }
    }, 250);
  };

  const getScoreColor = (val: number) => {
    if (val >= 85) return "text-success border-success/30";
    if (val >= 70) return "text-warning border-warning/30";
    return "text-red-500 border-red-500/30";
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Page Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Resume Intelligence</h2>
          <p className="text-xs text-muted">ATS analysis, parser checks, and optimization suggestions.</p>
        </div>
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
                <span className="text-[10px] text-success font-bold mt-0.5">Excellent</span>
              </div>
            </div>

            {/* Sub details */}
            <div className="w-full grid grid-cols-2 gap-4 border-t border-border pt-4 text-left">
              <div>
                <p className="text-[10px] text-muted font-medium">ATS Match Rating</p>
                <p className="text-sm font-bold text-foreground">High Compatibility</p>
              </div>
              <div>
                <p className="text-[10px] text-muted font-medium">File Structure</p>
                <p className="text-sm font-bold text-success flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Valid PDF</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Upload/Scanner box */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Re-scan Credentials</h3>

            {scanState === "idle" && (
              <button
                onClick={handleMockUpload}
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
                  <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden relative">
                    {/* Sweep glow */}
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
                  <p className="text-[10px] text-muted mt-1">Score improved by +4%. Career Score +2!</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setScanState("idle")}>
                  Upload Another File
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Missing Skills & Bullet Optimizer */}
        <div className="lg:col-span-7 space-y-6">
          {/* Missing Skills list */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">ATS Missing Keywords</h3>
            <div className="space-y-4">
              {missingSkills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-accent/10 border border-border rounded-2xl relative"
                >
                  <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground">{skill.name}</span>
                    <p className="text-xs text-muted leading-relaxed">{skill.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Bullet point optimizer */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Bullet-point Optimizer</h3>
              </div>
              <Badge variant="ai">AI Analyzer</Badge>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                Paste one of your current resume bullet points below. The AI will instantly rewrite it to demonstrate impact and key ATS search keywords.
              </p>
              <textarea
                placeholder="e.g., I built the backend server for a MERN social media app..."
                rows={3}
                className="w-full bg-accent/15 border border-border outline-none rounded-xl p-3 text-xs text-foreground placeholder-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    addNotification("Bullet point optimized! Check AI coach for details.", "info")
                  }
                >
                  Optimize Bullet Point
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
