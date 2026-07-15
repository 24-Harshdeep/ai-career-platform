"use client";

import React, { useState } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { FolderGit, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";

export const PortfolioPage: React.FC = () => {
  const addNotification = useCareerStore((state) => state.addNotification);
  const updateScore = useCareerStore((state) => state.updateScore);

  const [analyzing, setAnalyzing] = useState(false);
  const [gitScore, setGitScore] = useState(74);

  const portfolios = [
    {
      name: "MERN Social Platform",
      score: 88,
      status: "Verified",
      stack: ["React", "Express", "MongoDB", "Tailwind CSS"],
      warnings: ["Missing Docker configurations", "README documentation needs inline installation details"],
    },
    {
      name: "React eCommerce Portfolio",
      score: 92,
      status: "Optimized",
      stack: ["Next.js", "Redux", "Stripe", "PostgreSQL"],
      warnings: [],
    },
    {
      name: "Distributed Chat server",
      score: 62,
      status: "Review Required",
      stack: ["Node.js", "Socket.io", "Redis"],
      warnings: ["No unit testing suites found", "CI/CD setup is incomplete"],
    },
  ];

  const handleScanGithub = async () => {
    setAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200)); // Latency
    setGitScore(84);
    updateScore(3);
    addNotification("GitHub scan completed! Quality index increased to 84%. +3 Career Score.", "success");
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
            <FolderGit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Portfolio Intelligence</h2>
            <p className="text-xs text-muted">GitHub repository index scanner, readme documentation audits, and code analysis.</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleScanGithub}
          isLoading={analyzing}
          className="cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          <span>Scan GitHub</span>
        </Button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: GitHub Sync Metrics */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <FolderGit className="w-5 h-5 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">GitHub Code Metrics</h3>
            </div>

            <div className="flex justify-between items-center bg-accent/10 border border-border p-4 rounded-2xl">
              <div>
                <span className="text-[10px] text-muted font-bold uppercase block">Portfolio Quality Index</span>
                <span className="text-2xl font-extrabold text-foreground mt-1 block">{gitScore}%</span>
              </div>
              <Badge variant={gitScore >= 80 ? "success" : "warning"}>
                {gitScore >= 80 ? "High Quality" : "Needs Review"}
              </Badge>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted">Repositories analyzed</span>
                <span className="text-foreground font-semibold">14 active repositories</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted">Commit frequency</span>
                <span className="text-success font-semibold">High (42 commits this month)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Documentation coverage</span>
                <span className="text-warning font-semibold">Intermediate (68% README presence)</span>
              </div>
            </div>
          </Card>

          <Card variant="insight" className="p-6">
            <div className="flex items-center space-x-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-xs text-primary font-bold uppercase tracking-wider">AI Portfolio Tip</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed font-medium">
              Adding custom Dockerfiles to your **MERN Social Platform** repository will eliminate its primary warnings, boosting its quality score to 95%.
            </p>
          </Card>
        </div>

        {/* Right Column: Project Audits */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Project Repositories Quality</h3>
            <div className="space-y-5">
              {portfolios.map((port) => (
                <div
                  key={port.name}
                  className="p-4 bg-accent/10 border border-border rounded-2xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{port.name}</h4>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {port.stack.map((s) => (
                          <span
                            key={s}
                            className="text-[9px] font-semibold bg-card border border-border px-1.5 py-0.5 rounded text-muted"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-foreground">{port.score}%</span>
                      <p className="text-[9px] text-muted">{port.status}</p>
                    </div>
                  </div>

                  {/* Project warnings */}
                  {port.warnings.length > 0 ? (
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                        <span className="text-[9px] text-warning font-bold uppercase">Warnings:</span>
                      </div>
                      <ul className="list-disc pl-4 space-y-1">
                        {port.warnings.map((w) => (
                          <li key={w} className="text-[10px] text-muted font-medium">
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="border-t border-border pt-2 flex items-center space-x-1.5 text-success text-[10px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>README, stack versions, and Docker configuration optimized!</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
