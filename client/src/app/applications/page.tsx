"use client";

import React, { useState, useEffect } from "react";
import { useCareerStore, JobOpportunityData } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import {
  Briefcase,
  Search,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Link,
  ChevronRight,
  TrendingUp,
  X,
  Plus
} from "lucide-react";

export default function ApplicationsPage() {
  const jobPipeline = useCareerStore((state) => state.jobPipeline);
  const fetchJobPipeline = useCareerStore((state) => state.fetchJobPipeline);
  const matchJobDescription = useCareerStore((state) => state.matchJobDescription);
  const updateJobOpportunityStatus = useCareerStore((state) => state.updateJobOpportunityStatus);
  const deleteJobOpportunity = useCareerStore((state) => state.deleteJobOpportunity);
  const addNotification = useCareerStore((state) => state.addNotification);

  const [auditing, setAuditing] = useState(false);
  const [activeReport, setActiveReport] = useState<JobOpportunityData | null>(null);

  // Form states
  const [jdText, setJdText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");

  // Load pipeline on mount
  useEffect(() => {
    fetchJobPipeline();
  }, [fetchJobPipeline]);

  const handleAuditJD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim() || !jobTitle.trim() || !company.trim()) return;

    setAuditing(true);
    const opportunity = await matchJobDescription(jdText, jobTitle, company);
    if (opportunity) {
      setActiveReport(opportunity);
      addNotification("Job description compatibility checked. Opportunity added to pipeline.", "success");
      setJdText("");
      setJobTitle("");
      setCompany("");
    }
    setAuditing(false);
  };

  const getStatusBadge = (status: JobOpportunityData["status"]) => {
    switch (status) {
      case "Offer":
        return <Badge variant="success">Offer</Badge>;
      case "Interview":
      case "Final Round":
        return <Badge variant="warning">{status}</Badge>;
      case "Rejected":
        return <Badge variant="muted">Rejected</Badge>;
      case "Saved":
      case "Preparing":
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const pipelineStages: JobOpportunityData["status"][] = [
    "Saved",
    "Preparing",
    "Applied",
    "OA",
    "Interview",
    "Final Round",
    "Offer"
  ];

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Job Intelligence</h2>
          <p className="text-xs text-muted">Scan job specifications to assess skill-readiness and coordinate application pipelines.</p>
        </div>
      </div>

      {/* Grid: Search/Crawl and Match Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: JD Analyzer Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Search className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Analyze Job Description</h3>
            </div>

            <form onSubmit={handleAuditJD} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Role Title</label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Backend Lead"
                    className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground placeholder-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Company Name</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Stripe"
                    className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground placeholder-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted font-bold uppercase">Paste Job Description</label>
                <textarea
                  required
                  rows={4}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste details, requirements, or tech stacks..."
                  className="w-full bg-accent/15 border border-border outline-none rounded-xl p-3 text-xs text-foreground placeholder-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <Button
                type="submit"
                variant="ai"
                className="w-full text-sm font-semibold"
                isLoading={auditing}
              >
                Scan Job Specifications
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Active Match Report Analysis */}
        <div className="lg:col-span-7">
          {activeReport ? (
            <Card className="p-6 space-y-5 relative">
              <button
                onClick={() => setActiveReport(null)}
                className="absolute right-4 top-4 text-muted hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground leading-tight">{activeReport.title}</h3>
                  <p className="text-xs text-muted mt-1 font-semibold">{activeReport.company}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-primary">{activeReport.matchScore}%</span>
                  <p className="text-[9px] text-muted uppercase tracking-wider font-bold">Match Index</p>
                </div>
              </div>

              {/* Recommendation Suggestion Banner */}
              <div
                className={`p-4 border rounded-2xl flex items-start space-x-3 ${
                  activeReport.recommendation === "Apply Now"
                    ? "bg-success/5 border-success/20 text-success"
                    : "bg-warning/5 border-warning/20 text-warning"
                }`}
              >
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase">
                    AI Decision: {activeReport.recommendation}
                  </h4>
                  <p className="text-xs text-muted leading-relaxed">
                    {activeReport.recommendation === "Apply Now"
                      ? "Your profile shows high compatibility. Prepare submission files immediately."
                      : `Recommended study: ${activeReport.daysToReady} days. Optimize missing skills to push score to 90%+.`}
                  </p>
                </div>
              </div>

              {/* Score breakdown metrics */}
              <div className="grid grid-cols-3 gap-4 border-b border-border pb-4 text-xs">
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase">Resume Match</p>
                  <p className="font-bold text-foreground mt-0.5">{activeReport.resumeScore}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase">Projects Audit</p>
                  <p className="font-bold text-foreground mt-0.5">{activeReport.portfolioScore}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase">GitHub Quality</p>
                  <p className="font-bold text-foreground mt-0.5">{activeReport.githubScore}%</p>
                </div>
              </div>

              {/* Next Best Actions Checklist */}
              {activeReport.nextActions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Gaps Reconciliation Checklist</h4>
                  </div>
                  <div className="space-y-2">
                    {activeReport.nextActions.map((action, idx) => (
                      <div key={idx} className="p-3 bg-accent/10 border border-border rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-foreground">{action.gap}</span>
                          <span className="text-success flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>+{action.expectedImpact} Score</span>
                          </span>
                        </div>
                        <p className="text-[10px] text-muted leading-relaxed">{action.evidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-muted border border-dashed border-border min-h-[220px]">
              <Sparkles className="w-8 h-8 text-primary/50 mb-2 animate-pulse" />
              <span>Select an application from the pipeline board below to inspect compatibility details and skills gaps.</span>
            </Card>
          )}
        </div>
      </div>

      {/* Hiring Pipeline Kanban Board */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Pipeline Board</h3>
        
        {jobPipeline.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted border border-dashed border-border rounded-2xl">
            No active opportunities in pipeline. Auditing a job description will automatically add it here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columns aggregation */}
            {["Saved", "Applied", "Interview"].map((stage) => {
              const items = jobPipeline.filter((j) => {
                if (stage === "Interview") return ["Interview", "OA", "Final Round", "Offer"].includes(j.status);
                return j.status === stage;
              });

              return (
                <div key={stage} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">{stage}</span>
                    <Badge variant="info">{items.length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {items.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => setActiveReport(job)}
                        className="p-4 bg-accent/5 hover:bg-accent/15 border border-border hover:border-primary/40 rounded-xl space-y-3 transition-all duration-200 cursor-pointer group shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                              {job.title}
                            </h4>
                            <p className="text-[10px] text-muted font-medium mt-0.5">{job.company}</p>
                          </div>
                          <span className="text-xs font-extrabold text-foreground">{job.matchScore}%</span>
                        </div>

                        <div className="flex justify-between items-center text-[10px]">
                          {getStatusBadge(job.status)}
                          <div className="flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {job.status === "Saved" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateJobOpportunityStatus(job.id, "Applied");
                                }}
                                className="text-primary font-bold hover:underline"
                              >
                                Apply
                              </button>
                            )}
                            {job.status === "Applied" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateJobOpportunityStatus(job.id, "Interview");
                                }}
                                className="text-warning font-bold hover:underline"
                              >
                                Interview
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteJobOpportunity(job.id);
                              }}
                              className="text-red-400 font-bold hover:text-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
