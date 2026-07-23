"use client";

import React, { useState, useEffect } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { FolderGit, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, BarChart4, Wrench, Globe, Link, Settings, Sparkles } from "lucide-react";
import PoweredBy from "@/components/ui/PoweredBy";

export const PortfolioPage: React.FC = () => {
  const developerProfile = useCareerStore((state) => state.developerProfile);
  const projectHistory = useCareerStore((state) => state.projectHistory);
  const fetchDeveloperProfile = useCareerStore((state) => state.fetchDeveloperProfile);
  const syncDeveloperProfile = useCareerStore((state) => state.syncDeveloperProfile);
  const fetchProjectHistory = useCareerStore((state) => state.fetchProjectHistory);
  const auditProject = useCareerStore((state) => state.auditProject);
  const addNotification = useCareerStore((state) => state.addNotification);

  const [analyzing, setAnalyzing] = useState(false);
  const [auditing, setAuditing] = useState(false);
  
  // Input fields
  const [projectUrl, setProjectUrl] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectType, setProjectType] = useState("Portfolio Website");

  // Load initial profile & history from database on mount
  useEffect(() => {
    fetchDeveloperProfile();
    fetchProjectHistory();
  }, [fetchDeveloperProfile, fetchProjectHistory]);

  const handleScanGithub = async () => {
    setAnalyzing(true);
    await syncDeveloperProfile("harshdeep");
    addNotification("GitHub repository synchronization complete. Quality indexes updated.", "success");
    setAnalyzing(false);
  };

  const handleAuditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectUrl) return;

    setAuditing(true);
    await auditProject(projectUrl, projectTitle || "My Deployed Project", projectType);
    addNotification("Project audit complete. Deployment scores updated.", "success");
    setProjectUrl("");
    setProjectTitle("");
    setAuditing(false);
  };

  const gitScore = developerProfile ? developerProfile.overallHealth : 82;
  const level = developerProfile ? developerProfile.engineeringLevel : "Intermediate";
  const repoCount = developerProfile ? developerProfile.repositoryCount : 3;

  // Fallback repos if profile is empty
  const repos = developerProfile ? developerProfile.repositories : [
    { id: "repo-1", name: "careeros-client", description: "Frontend Next.js dashboard client application", url: "", language: "TypeScript", stars: 5, forks: 1, healthScore: 88, documentationScore: 90, testingScore: 85, architectureScore: 90, activityScore: 85 },
    { id: "repo-2", name: "careeros-server", description: "Express backend API server systems", url: "", language: "JavaScript", stars: 3, forks: 0, healthScore: 78, documentationScore: 80, testingScore: 70, architectureScore: 80, activityScore: 75 },
    { id: "repo-3", name: "dsa-challenges", description: "Solved algorithms and sorting puzzles", url: "", language: "Go", stars: 1, forks: 0, healthScore: 68, documentationScore: 60, testingScore: 50, architectureScore: 70, activityScore: 60 }
  ];

  const coverage = developerProfile ? developerProfile.technologyCoverage : {
    Frontend: 50,
    Backend: 40,
    Database: 10,
    DevOps: 0
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
            <FolderGit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Project & Developer Intelligence</h2>
            <p className="text-xs text-muted">Audits code repositories and deployed projects to index quality and verify technology evidence.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PoweredBy engines={[
            {
              type: "api",
              label: "GitHub API",
              description: "Inspects live codebases for developer activity.",
              points: ["Reads repositories & languages", "Analyzes commit frequencies"]
            },
            {
              type: "user",
              label: "User Portfolios",
              description: "User submits URLs for automated evaluation.",
              points: ["Submits GitHub username", "Registers live project URLs"]
            },
            {
              type: "engine",
              label: "Audit Engines",
              description: "Calculates scores for standard development practices.",
              points: ["Performance, SEO, & Accessibility audits", "Security & Documentation checks"]
            },
            {
              type: "ai",
              label: "AI Suggestions",
              description: "Improves project documentation and README structures.",
              points: ["Suggests README improvements", "Refines project description highlights"]
            }
          ]} />

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleScanGithub}
            isLoading={analyzing}
            className="cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            <span>Sync GitHub</span>
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Repository Sync & Technology Coverage */}
        <div className="lg:col-span-5 space-y-6">
          {/* GitHub Sync */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <FolderGit className="w-5 h-5 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Developer Health Overview</h3>
            </div>

            <div className="flex justify-between items-center bg-accent/10 border border-border p-4 rounded-2xl">
              <div>
                <span className="text-[10px] text-muted font-bold uppercase block">Developer Health Score</span>
                <span className="text-2xl font-extrabold text-foreground mt-1 block">{gitScore}%</span>
              </div>
              <Badge variant={gitScore >= 80 ? "success" : "warning"}>
                {level} Level
              </Badge>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted">Repositories analyzed</span>
                <span className="text-foreground font-semibold">{repoCount} active</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted">Best repository</span>
                <span className="text-success font-semibold">
                  {developerProfile ? developerProfile.bestRepository : "careeros-client"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Weakest repository</span>
                <span className="text-warning font-semibold">
                  {developerProfile ? developerProfile.weakestRepository : "dsa-challenges"}
                </span>
              </div>
            </div>
          </Card>

          {/* Technology Coverage */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <BarChart4 className="w-5 h-5 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Technology Coverage</h3>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-muted">Frontend</span>
                  <span className="text-foreground">{coverage.Frontend}%</span>
                </div>
                <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${coverage.Frontend}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-muted">Backend</span>
                  <span className="text-foreground">{coverage.Backend}%</span>
                </div>
                <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${coverage.Backend}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-muted">Database</span>
                  <span className="text-foreground">{coverage.Database}%</span>
                </div>
                <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: `${coverage.Database}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-muted">DevOps</span>
                  <span className="text-foreground">{coverage.DevOps}%</span>
                </div>
                <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div className="h-full bg-warning rounded-full" style={{ width: `${coverage.DevOps}%` }} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Project Auditing & Code Health lists */}
        <div className="lg:col-span-7 space-y-6">
          {/* Audit Project Form */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Audit Deployed Project</h3>
            </div>

            <form onSubmit={handleAuditProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Project Title</label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. MERN eCommerce"
                    className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground placeholder-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Project Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="Portfolio Website">Portfolio Website</option>
                    <option value="Backend API">Backend API</option>
                    <option value="Chrome Extension">Chrome Extension</option>
                    <option value="NPM Package">NPM Package</option>
                    <option value="AI Project">AI Project</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted font-bold uppercase">Deployment URL</label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    required
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="e.g. https://my-app.vercel.app"
                    className="flex-1 bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground placeholder-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                  <Button
                    type="submit"
                    variant="ai"
                    size="sm"
                    isLoading={auditing}
                    className="cursor-pointer font-bold text-xs"
                  >
                    Analyze Project
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {/* Deployed Project Audits list */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Project Intelligence Score</h3>
            <div className="space-y-5">
              {projectHistory.length > 0 ? (
                projectHistory.map((proj) => (
                  <div
                    key={proj.projectId}
                    className="p-4 bg-accent/10 border border-border rounded-2xl space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{proj.title}</h4>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <Link className="w-3 h-3 text-muted" />
                          <a
                            href={proj.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline"
                          >
                            {proj.url}
                          </a>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[9px] font-bold bg-card border border-border px-1.5 py-0.2 rounded text-muted">
                            {proj.projectType}
                          </span>
                          <span className="text-[9px] font-bold bg-card border border-border px-1.5 py-0.2 rounded text-muted">
                            Deployed on {proj.deploymentPlatform}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-foreground">{proj.overallScore}%</span>
                        <p className="text-[9px] text-muted">Project Score</p>
                      </div>
                    </div>

                    {/* Technology Evidence list */}
                    <div className="border-t border-border/50 pt-3">
                      <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Technology Evidence Verified</h5>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${proj.technologyEvidence.hasAuth ? "text-success" : "text-muted opacity-40"}`} />
                          <span className={proj.technologyEvidence.hasAuth ? "text-foreground font-medium" : "text-muted"}>Authentication</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${proj.technologyEvidence.hasDatabase ? "text-success" : "text-muted opacity-40"}`} />
                          <span className={proj.technologyEvidence.hasDatabase ? "text-foreground font-medium" : "text-muted"}>Database Usage</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${proj.technologyEvidence.hasRestApi ? "text-success" : "text-muted opacity-40"}`} />
                          <span className={proj.technologyEvidence.hasRestApi ? "text-foreground font-medium" : "text-muted"}>REST APIs</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${proj.technologyEvidence.hasDocker ? "text-success" : "text-muted opacity-40"}`} />
                          <span className={proj.technologyEvidence.hasDocker ? "text-foreground font-medium" : "text-muted"}>Docker Container</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${proj.technologyEvidence.hasTesting ? "text-success" : "text-muted opacity-40"}`} />
                          <span className={proj.technologyEvidence.hasTesting ? "text-foreground font-medium" : "text-muted"}>Unit Testing</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${proj.technologyEvidence.hasDevOps ? "text-success" : "text-muted opacity-40"}`} />
                          <span className={proj.technologyEvidence.hasDevOps ? "text-foreground font-medium" : "text-muted"}>CI/CD DevOps</span>
                        </div>
                      </div>
                    </div>

                    {/* Quality Breakdowns */}
                    <div className="grid grid-cols-4 gap-2 pt-2 text-[10px] text-muted border-t border-border/30">
                      <div>
                        <p className="font-semibold text-foreground">{proj.performanceScore}%</p>
                        <p>Performance</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{proj.accessibilityScore}%</p>
                        <p>Accessibility</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{proj.seoScore}%</p>
                        <p>SEO</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{proj.documentationScore}%</p>
                        <p>Documentation</p>
                      </div>
                    </div>

                    {/* Missing Practices warnings */}
                    {proj.missingPractices.length > 0 && (
                      <div className="border-t border-border/50 pt-3 space-y-2">
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                          <span className="text-[9px] text-warning font-bold uppercase">Missing Practices:</span>
                        </div>
                        <div className="space-y-2">
                          {proj.missingPractices.map((mp, index) => (
                            <div key={index} className="bg-card border border-border p-2.5 rounded-xl space-y-1 text-[10px]">
                              <div className="flex justify-between">
                                <span className="font-bold text-foreground">{mp.gap}</span>
                                <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${
                                  mp.priority === "High" 
                                    ? "bg-red-500/10 border-red-500/20 text-red-400" 
                                    : "bg-warning/10 border-warning/20 text-warning"
                                }`}>
                                  {mp.priority} Priority
                                </span>
                              </div>
                              <p className="text-muted leading-relaxed">{mp.evidence}</p>
                              <p className="text-success font-semibold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-success" />
                                <span>Projected Impact: +{mp.expectedImpact} Career Score</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-muted">
                  No deployed projects audited yet. Paste a URL above to verify technology evidence.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
