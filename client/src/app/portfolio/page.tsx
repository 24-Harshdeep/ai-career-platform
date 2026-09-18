"use client";

import React, { useState, useEffect } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { FolderGit, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, BarChart4, Wrench, Globe, Link, Settings, Sparkles } from "lucide-react";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import PoweredBy from "@/components/ui/PoweredBy";

function extractGithubUsername(urlOrName: string): string {
  if (!urlOrName) return "";
  const trimmed = urlOrName.trim().replace(/\/$/, "");
  const candidateUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (candidateUrl.includes("github.com/")) {
    try {
      const parsedUrl = new URL(candidateUrl);
      if (parsedUrl.hostname.toLowerCase() !== "github.com" && parsedUrl.hostname.toLowerCase() !== "www.github.com") {
        return "";
      }
      const pathname = parsedUrl.pathname;
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length === 1) return parts[0];
    } catch (e) {
      // Fallback
    }
  }
  return /^[a-zA-Z0-9-]+$/.test(trimmed) ? trimmed : "";
}

export const PortfolioPage: React.FC = () => {
  const profile = useCareerStore((state) => state.profile);
  const resumeAnalysis = useCareerStore((state) => state.resumeAnalysis);
  const developerProfile = useCareerStore((state) => state.developerProfile);
  const projectHistory = useCareerStore((state) => state.projectHistory);
  const fetchDeveloperProfile = useCareerStore((state) => state.fetchDeveloperProfile);
  const syncDeveloperProfile = useCareerStore((state) => state.syncDeveloperProfile);
  const fetchProjectHistory = useCareerStore((state) => state.fetchProjectHistory);
  const auditProject = useCareerStore((state) => state.auditProject);
  const addNotification = useCareerStore((state) => state.addNotification);

  const [analyzing, setAnalyzing] = useState(false);
  const [auditing, setAuditing] = useState(false);
  
  // GitHub Input State
  const defaultGithubUrl = profile?.githubUrl || resumeAnalysis?.activeVersionContent?.personalInfo?.githubUrl || "";
  const [githubInput, setGithubInput] = useState("");

  useEffect(() => {
    if (!githubInput && defaultGithubUrl) {
      setGithubInput(defaultGithubUrl);
    }
  }, [defaultGithubUrl]);

  // Input fields for project audit
  const [projectUrl, setProjectUrl] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectType, setProjectType] = useState("Portfolio Website");

  // Load initial profile & history from database on mount
  useEffect(() => {
    fetchDeveloperProfile();
    fetchProjectHistory();
  }, [fetchDeveloperProfile, fetchProjectHistory]);

  const handleScanGithub = async () => {
    const rawUrl = githubInput || profile?.githubUrl || resumeAnalysis?.activeVersionContent?.personalInfo?.githubUrl || "";
    const username = extractGithubUsername(rawUrl);
    if (!username) {
      addNotification("Please enter your GitHub username or profile URL before syncing.", "warning");
      return;
    }

    setAnalyzing(true);
    try {
      const success = await syncDeveloperProfile(username);
      if (success) {
        addNotification(`GitHub repository synchronization complete for '${username}'.`, "success");
        await fetchDeveloperProfile();
      }
    } catch (err: any) {
      console.error("Sync GitHub error:", err);
      addNotification(`Sync failed: ${err.message || "Network error"}`, "warning");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAuditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectUrl) return;

    setAuditing(true);
    try {
      await auditProject(projectUrl, projectTitle || "My Deployed Project", projectType);
      addNotification("Project audit complete. Deployment scores updated.", "success");
      setProjectUrl("");
      setProjectTitle("");
    } catch (err: any) {
      addNotification(`Project audit failed: ${err.message || "Error"}`, "warning");
    } finally {
      setAuditing(false);
    }
  };

  const gitScore = developerProfile?.overallHealth ?? null;
  const level = developerProfile?.engineeringLevel ?? null;
  const repoCount = developerProfile?.repositoryCount ?? 0;

  const repos = developerProfile?.repositories || [];

  const coverage = developerProfile?.technologyCoverage || {
    Frontend: null,
    Backend: null,
    Database: null,
    DevOps: null
  };

  return (
    <PageTransition className="space-y-6 pb-12">
      <StaggerItem>
        <PageHeader 
          icon={FolderGit} 
          title="Project & Developer Intelligence" 
          description="Audits code repositories and deployed projects to index quality and verify technology evidence."
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={githubInput}
              onChange={(e) => setGithubInput(e.target.value)}
              placeholder="github.com/username or username"
              className="bg-accent/15 border border-border outline-none rounded-xl px-3 py-1.5 text-xs text-foreground placeholder-muted focus:border-primary/50"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleScanGithub}
              isLoading={analyzing}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              <span>Sync GitHub</span>
            </Button>
          </div>
        </PageHeader>
      </StaggerItem>

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
                <span className="text-2xl font-extrabold text-foreground mt-1 block">{gitScore == null ? "Not available" : `${gitScore}%`}</span>
              </div>
              {level && <Badge variant={gitScore !== null && gitScore >= 80 ? "success" : "warning"}>{level} Level</Badge>}
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted">Repositories analyzed</span>
                <span className="text-foreground font-semibold">{repoCount} active</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted">Best repository</span>
                <span className="text-success font-semibold">
                  {developerProfile?.bestRepository || "No evidence yet"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Weakest repository</span>
                <span className="text-warning font-semibold">
                  {developerProfile?.weakestRepository || "No evidence yet"}
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
                  <span className="text-foreground">{coverage.Frontend == null ? "Not available" : `${coverage.Frontend}%`}</span>
                </div>
                <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${coverage.Frontend || 0}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-muted">Backend</span>
                  <span className="text-foreground">{coverage.Backend == null ? "Not available" : `${coverage.Backend}%`}</span>
                </div>
                <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${coverage.Backend || 0}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-muted">Database</span>
                  <span className="text-foreground">{coverage.Database == null ? "Not available" : `${coverage.Database}%`}</span>
                </div>
                <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: `${coverage.Database || 0}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-muted">DevOps</span>
                  <span className="text-foreground">{coverage.DevOps == null ? "Not available" : `${coverage.DevOps}%`}</span>
                </div>
                <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div className="h-full bg-warning rounded-full" style={{ width: `${coverage.DevOps || 0}%` }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Scanned GitHub Repositories */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <FolderGit className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Scanned GitHub Repositories</h3>
              </div>
              <Badge variant="info">{repos.length} Found</Badge>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {repos.length > 0 ? repos.map((repo: any, idx) => {
                const isBest = developerProfile?.bestRepository === repo.name;
                const score = repo.healthScore;
                
                // Construct recommendation text
                let recommendation = "Recommended as a portfolio project highlight.";
                if (score != null && score >= 85) {
                  recommendation = "Highly Recommended: Demonstrates production-grade structure (README, tests).";
                } else if (score != null && score < 70) {
                  recommendation = "Optional: Useful for skills evidence, but wrap in a larger application structure.";
                }

                return (
                  <div key={repo.id || idx} className="bg-card border border-border p-3.5 rounded-2xl text-xs space-y-2 relative hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-foreground flex items-center gap-1.5">
                          {repo.name}
                          {isBest && (
                            <span className="text-[9px] bg-success/15 text-success border border-success/20 px-1 rounded-md font-bold uppercase">
                              Best Repo
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-muted line-clamp-1 mt-0.5">{repo.description}</p>
                      </div>
                      {score != null && <Badge variant={score >= 80 ? "success" : "warning"}>{score}% Health</Badge>}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50 text-[10px]">
                      <div className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        <span className="text-foreground font-semibold uppercase">{repo.language || "Language not returned"}</span>
                      </div>
                      <span className="text-muted italic">{recommendation}</span>
                    </div>
                  </div>
                );
              }) : <div className="text-center py-8 text-xs text-muted">No GitHub repositories returned. Sync a verified GitHub profile to see repository evidence.</div>}
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
    </PageTransition>
  );
};

export default PortfolioPage;
