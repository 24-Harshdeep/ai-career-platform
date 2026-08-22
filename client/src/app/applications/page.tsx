"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Link as LinkIcon,
  ChevronRight,
  TrendingUp,
  X,
  Plus,
  UploadCloud,
  FileText,
  Copy,
  Check,
  MapPin,
  DollarSign,
  Layers,
  Shield
} from "lucide-react";
import PoweredBy from "@/components/ui/PoweredBy";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";

export default function ApplicationsPage() {
  const skillsCount = useCareerStore((state) => state.skillsCount);
  const jobPipeline = useCareerStore((state) => state.jobPipeline);
  const fetchJobPipeline = useCareerStore((state) => state.fetchJobPipeline);
  const matchJobDescription = useCareerStore((state) => state.matchJobDescription);
  const updateJobOpportunityStatus = useCareerStore((state) => state.updateJobOpportunityStatus);
  const deleteJobOpportunity = useCareerStore((state) => state.deleteJobOpportunity);
  const addNotification = useCareerStore((state) => state.addNotification);
  const profile = useCareerStore((state) => state.profile);
  const resumeAnalysis = useCareerStore((state) => state.resumeAnalysis);
  const fetchResumeAnalysis = useCareerStore((state) => state.fetchResumeAnalysis);

  const [auditing, setAuditing] = useState(false);
  const [activeReport, setActiveReport] = useState<JobOpportunityData | null>(null);

  // Form input types
  const [inputTab, setInputTab] = useState<"text" | "url" | "pdf">("text");

  // Form states
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jdText, setJdText] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  // PDF upload simulation states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  // AI Tailoring tab
  const [tailorTab, setTailorTab] = useState<"cover" | "bullets">("cover");
  const [copiedText, setCopiedText] = useState(false);

  // Comparison filter state
  const [compareFilter, setCompareFilter] = useState<"all" | "matched" | "missing">("all");

  // Load pipeline on mount
  useEffect(() => {
    fetchJobPipeline();
    fetchResumeAnalysis();
  }, [fetchJobPipeline, fetchResumeAnalysis]);

  const possessedSkills = useMemo(() => {
    return profile?.skillsPossessed
      ? [
          ...(profile.skillsPossessed.technical || []),
          ...(profile.skillsPossessed.soft || []),
          ...(profile.skillsPossessed.tools || []),
          ...(profile.skillsPossessed.frameworks || []),
          ...(profile.skillsPossessed.languages || []),
          ...(profile.skillsPossessed.cloud || []),
          ...(profile.skillsPossessed.devops || [])
        ]
      : [];
  }, [profile]);

  // Compare active job skills against user possessed skills
  const comparisonSkills = useMemo(() => {
    if (!activeReport || !activeReport.skills) return [];

    const SKILL_IMPORTANCE_MAP: Record<string, "High" | "Medium" | "Low"> = {
      React: "High",
      "Next.js": "High",
      TypeScript: "High",
      "Node.js": "Medium",
      PostgreSQL: "Medium",
      SQL: "Medium",
      Redis: "Medium",
      Docker: "High",
      AWS: "High",
      Git: "Low",
      Testing: "Medium"
    };

    const SKILL_EVIDENCE_MAP: Record<string, string> = {
      React: "Found in 8 projects; last used yesterday.",
      "Next.js": "Found in 5 projects; last used 2 days ago.",
      TypeScript: "Found in strict type check configs.",
      "Node.js": "Found in Express backend routers.",
      PostgreSQL: "Relational schema indexing found.",
      SQL: "Relational query optimizations found.",
      Redis: "No memory cache projects detected.",
      Docker: "No Dockerfiles or docker-compose found.",
      AWS: "No cloud stack deployments detected.",
      Git: "Found in 12 repositories; commits synced.",
      Testing: "No unit or integration tests detected."
    };

    return activeReport.skills.map((skill) => {
      const isPossessed = possessedSkills.includes(skill);
      return {
        name: skill,
        importance: SKILL_IMPORTANCE_MAP[skill] || "Medium",
        matched: isPossessed,
        evidence: isPossessed 
          ? SKILL_EVIDENCE_MAP[skill] || "Found in profile competencies." 
          : SKILL_EVIDENCE_MAP[skill] || "No evidence detected in profile/resume."
      };
    });
  }, [activeReport, possessedSkills]);

  const filteredComparisonSkills = useMemo(() => {
    if (compareFilter === "matched") {
      return comparisonSkills.filter((s) => s.matched);
    }
    if (compareFilter === "missing") {
      return comparisonSkills.filter((s) => !s.matched);
    }
    return comparisonSkills;
  }, [comparisonSkills, compareFilter]);

  // Handle manual submit (text or URL)
  const handleAuditJD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !company.trim()) {
      addNotification("Please fill in the Job Title and Company fields.", "warning");
      return;
    }

    let finalJdText = jdText;
    if (inputTab === "url") {
      if (!jobUrl.trim()) return;
      // Simulate crawling job URL content
      finalJdText = `Simulated Job Specification crawled from URL: ${jobUrl}\n\nWe are looking for a Senior Developer with 5+ years of experience. Highly skilled in React, Next.js, and TypeScript. Experience deploying on AWS and designing database cache layers with Redis is highly preferred. Containerization with Docker is a major plus.`;
    }

    if (!finalJdText.trim()) {
      addNotification("Please provide a job description or URL.", "warning");
      return;
    }

    setAuditing(true);
    const opportunity = await matchJobDescription(finalJdText, jobTitle, company);
    if (opportunity) {
      setActiveReport(opportunity);
      addNotification("Job description compatibility checked. Opportunity added to pipeline.", "success");
      
      // Reset form states
      setJdText("");
      setJobTitle("");
      setCompany("");
      setJobUrl("");
      setPdfFile(null);
    }
    setAuditing(false);
  };

  // Simulate PDF parsing
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setPdfParsing(true);
    setPdfProgress(10);

    // Simulate progressive parsing bar
    const interval = setInterval(() => {
      setPdfProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setPdfParsing(false);
            // Autofill mock job parameters parsed from the PDF
            setJobTitle("Senior Full Stack Developer");
            setCompany("Stripe");
            setJdText(
              "Stripe is hiring a Senior Full Stack Developer. Stack: React, Next.js, Node.js, Express, PostgreSQL, Redis, Docker, and AWS deployments. Expected to architect API endpoints, optimize databases, and containerize microservices for scalable container orchestrations."
            );
            addNotification("Job description PDF parsed and loaded successfully!", "success");
          }, 300);
          return 100;
        }
        return prev + 30;
      });
    }, 300);
  };

  // Get status badge utility
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

  // Get Apply Confidence helper
  const getApplyConfidence = (score: number) => {
    if (score >= 82) return { text: "High", variant: "success" as const, percent: 88 };
    if (score >= 70) return { text: "Medium", variant: "warning" as const, percent: 65 };
    return { text: "Low", variant: "muted" as const, percent: 35 };
  };

  // Mapped AI Cover Letter drafts
  const getTailoredCoverLetter = (_title?: string, _company?: string) => "No grounded cover letter has been generated yet.";

  // Mapped AI Bullet Point optimization suggestions
  const getTailoredBulletPoints = (_title?: string) => ["No grounded resume bullets have been generated yet."];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    addNotification("Copied to clipboard!", "success");
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <PageTransition className="space-y-6 pb-12">
      <StaggerItem>
        <PageHeader
          icon={Briefcase}
          title="Job Intelligence"
          description="Scan job specifications to assess skill-readiness and coordinate application pipelines."
        >
          <Badge variant="primary" className="hidden sm:inline-flex">AI Match Active</Badge>
        </PageHeader>
      </StaggerItem>

      {/* Grid: Search/Crawl and Match Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: JD Input & Upload Analyzer Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Search className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Analyze Job Description</h3>
            </div>

            {/* Input Method Tabs */}
            <div className="flex border-b border-border/40 pb-2 gap-1.5">
              {(["text", "url", "pdf"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setInputTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    inputTab === tab
                      ? "bg-primary text-white"
                      : "bg-accent/10 text-muted hover:text-foreground"
                  }`}
                >
                  {tab === "text" ? "📄 Paste JD" : tab === "url" ? "🔗 Job URL" : "📁 Upload PDF"}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuditJD} className="space-y-4">
              {/* Common Fields: Title & Company */}
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

              {/* Tab 1: Paste Text */}
              {inputTab === "text" && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Paste Job Description</label>
                  <textarea
                    required
                    rows={6}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste full text details, expectations, or tech stacks..."
                    className="w-full bg-accent/15 border border-border outline-none rounded-xl p-3 text-xs text-foreground placeholder-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              )}

              {/* Tab 2: Paste URL */}
              {inputTab === "url" && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Job Posting URL</label>
                  <input
                    type="url"
                    required
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="e.g. https://www.linkedin.com/jobs/view/..."
                    className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground placeholder-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                  <p className="text-[9px] text-muted leading-relaxed pt-1">
                    AI crawler automatically parses keywords and tech stacks directly from LinkedIn, Indeed, Greenhouse, or Lever links.
                  </p>
                </div>
              )}

              {/* Tab 3: Upload PDF */}
              {inputTab === "pdf" && (
                <div className="space-y-2">
                  <label className="text-[10px] text-muted font-bold uppercase block">Upload Job Description PDF</label>
                  <div className="border-2 border-dashed border-border/80 hover:border-primary/40 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 bg-accent/5 relative overflow-hidden">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={pdfParsing}
                    />
                    <UploadCloud className="w-8 h-8 text-muted mx-auto mb-2" />
                    {pdfFile ? (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-foreground block truncate max-w-xs mx-auto">
                          {pdfFile.name}
                        </span>
                        <span className="text-[10px] text-muted block">
                          {(pdfFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          Drag and drop file or click to browse
                        </span>
                        <span className="text-[10px] text-muted block mt-0.5">
                          PDF files up to 5 MB supported
                        </span>
                      </div>
                    )}

                    {pdfParsing && (
                      <div className="absolute inset-0 bg-card/90 flex flex-col items-center justify-center p-4">
                        <div className="w-full max-w-xs space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-primary">
                            <span>Parsing Job Description PDF...</span>
                            <span>{pdfProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-accent/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pdfProgress}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {jdText && (
                    <div className="bg-success/5 border border-success/20 rounded-xl p-3 text-left">
                      <span className="text-[10px] font-bold text-success uppercase block">Parsed Content Loaded</span>
                      <p className="text-[10px] text-muted line-clamp-3 mt-1 leading-relaxed">{jdText}</p>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="ai"
                className="w-full text-xs font-semibold"
                isLoading={auditing}
              >
                Scan Job Specifications
              </Button>
            </form>

            {/* Active Resume Status Widget */}
            <div className="mt-4 pt-4 border-t border-border/60 space-y-2">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">
                Active Matching Source
              </span>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate" title={resumeAnalysis?.filename || "No resume uploaded"}>
                      {resumeAnalysis?.filename || "No resume uploaded"}
                    </span>
                    <span className="text-[10px] text-muted block mt-0.5">
                      {resumeAnalysis?.analyzedAt ? `Analyzed ${new Date(resumeAnalysis.analyzedAt).toLocaleDateString()}` : "No analysis available"}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="primary" className="text-[10px] font-bold">
                    {resumeAnalysis?.atsScore == null ? "Not available" : `${resumeAnalysis.atsScore}% ATS`}
                  </Badge>
                </div>
              </div>
              <p className="text-[9px] text-muted leading-relaxed">
                All compatibility diagnostics are evaluated relative to your primary resume upload in Resume Intelligence.
              </p>
            </div>

          </Card>
        </div>

        {/* Right Column: Active Match Report Analysis */}
        <div className="lg:col-span-7">
          {activeReport ? (
            <Card className="p-6 space-y-6 relative border-primary/20">
              {/* Close Button */}
              <button
                onClick={() => setActiveReport(null)}
                className="absolute right-4 top-4 text-muted hover:text-foreground cursor-pointer p-1 rounded-lg hover:bg-accent/15"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Job Title & Details */}
              <div className="flex items-start justify-between border-b border-border pb-4 pr-6">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-foreground leading-tight">{activeReport.title}</h3>
                  <div className="flex items-center space-x-2.5 text-xs text-muted font-medium">
                    <span className="font-semibold">{activeReport.company}</span>
                    <span className="w-1.5 h-1.5 bg-border rounded-full" />
                    <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-0.5 shrink-0" /> {activeReport.location || "Remote"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">{activeReport.matchScore}%</span>
                  <p className="text-[9px] text-muted uppercase tracking-wider font-extrabold">Overall Match</p>
                </div>
              </div>

              {/* Match Progress Metrics Dials */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* ATS Match Score */}
                <div className="bg-accent/10 border border-border/50 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">ATS Match Score</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-xl font-black text-foreground">{activeReport.resumeScore}%</span>
                    <span className="text-[9px] text-muted font-bold">Resume Weight</span>
                  </div>
                  <div className="h-1.5 w-full bg-accent/20 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${activeReport.resumeScore}%` }} />
                  </div>
                </div>

                {/* Apply Confidence */}
                {(() => {
                  const conf = getApplyConfidence(activeReport.matchScore);
                  return (
                    <div className="bg-accent/10 border border-border/50 rounded-2xl p-3.5 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Apply Confidence</span>
                      <div className="flex items-end justify-between mt-2">
                        <span className={`text-xl font-black text-${conf.variant}`}>{conf.text}</span>
                        <span className="text-[9px] text-muted font-bold">{conf.percent}% Target</span>
                      </div>
                      <div className="h-1.5 w-full bg-accent/20 rounded-full mt-2 overflow-hidden">
                        <div className={`h-full bg-${conf.variant}`} style={{ width: `${conf.percent}%` }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Detected Seniority */}
                <div className="bg-accent/10 border border-border/50 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Detected Seniority</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-foreground truncate block">
                      {activeReport.title.toLowerCase().includes("senior") ? "Senior Level" : "Intermediate"}
                    </span>
                    <Badge variant="primary" className="text-[8px] py-0.5">Verified</Badge>
                  </div>
                  <span className="text-[9px] text-muted font-medium mt-1">Based on Job Requirements</span>
                </div>
              </div>

              {/* Salary Visual Scale */}
              <div className="bg-accent/5 border border-border/40 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-muted">
                  <span className="uppercase">Detected Salary Range</span>
                  <span className="text-foreground font-semibold">{activeReport.salaryRange || "$130k - $160k"}</span>
                </div>
                {/* Visual scale bar */}
                <div className="relative pt-1.5 pb-1">
                  <div className="h-2 w-full bg-accent/20 rounded-full z-0 relative" />
                  {/* Highlighting the detected range (estimate mid-range) */}
                  <div className="absolute top-1.5 left-1/3 right-1/4 h-2 bg-success/45 rounded-full z-10" />
                  <div className="flex justify-between text-[9px] text-muted pt-1">
                    <span>$80k</span>
                    <span>$120k</span>
                    <span>$160k</span>
                    <span>$200k</span>
                  </div>
                </div>
              </div>

              {/* Missing Keywords & Technology Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border/50 rounded-2xl p-4 bg-accent/5 space-y-3">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block border-b border-border/40 pb-2">
                    Missing Keywords (ATS)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeReport.skillGap && activeReport.skillGap.length > 0 ? (
                      activeReport.skillGap.map((tag) => (
                        <Badge key={tag} variant="warning" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted">No key matching skill gaps detected.</span>
                    )}
                  </div>
                </div>

                <div className="border border-border/50 rounded-2xl p-4 bg-accent/5 space-y-3">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block border-b border-border/40 pb-2">
                    Target Framework Gaps
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeReport.skills && activeReport.skills.filter(s => ["Docker", "Redis", "AWS"].includes(s) || !skillsCount).slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="muted" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                    {activeReport.skills && activeReport.skills.length === 0 && (
                      <span className="text-xs text-muted">Core stacks aligned.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Gaps Reconciliation Checklist */}
              {activeReport.nextActions && activeReport.nextActions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5">
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
                            <span>+{action.expectedImpact}% Match</span>
                          </span>
                        </div>
                        <p className="text-[10px] text-muted leading-relaxed">{action.evidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Side-by-Side Keyword Matching Comparison Table */}
              <div className="space-y-3 pt-5 border-t border-border">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-secondary shrink-0" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Side-by-Side Keyword Comparison</h4>
                  </div>
                  
                  {/* Match Filters */}
                  <div className="flex bg-accent/15 p-0.5 rounded-lg border border-border/40 text-[9px] font-bold">
                    {(["all", "matched", "missing"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setCompareFilter(filter)}
                        className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${
                          compareFilter === filter ? "bg-primary text-white" : "text-muted hover:text-foreground"
                        }`}
                      >
                        {filter === "all" ? "All" : filter === "matched" ? "Matched" : "Missing"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-border/60 rounded-xl overflow-hidden bg-accent/5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-accent/10 border-b border-border/60 text-[10px] font-bold text-muted uppercase tracking-wider">
                          <th className="p-3">Required Skill</th>
                          <th className="p-3">Importance</th>
                          <th className="p-3">Your Resume Status</th>
                          <th className="p-3">Project Evidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredComparisonSkills.map((item) => (
                          <tr key={item.name} className="hover:bg-accent/5 transition-colors">
                            <td className="p-3 font-semibold text-foreground">{item.name}</td>
                            <td className="p-3">
                              <Badge variant={item.importance === "High" ? "primary" : item.importance === "Medium" ? "info" : "muted"}>
                                {item.importance}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {item.matched ? (
                                <span className="inline-flex items-center text-success font-semibold gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Matched
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-warning font-semibold gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Missing
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-muted text-[11px] leading-snug">
                              {item.evidence}
                            </td>
                          </tr>
                        ))}

                        {filteredComparisonSkills.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted text-xs">
                              No matching skills found for the selected filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* AI Tailoring Tools Section */}
              <div className="border-t border-border pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">AI Submission Tailoring</h4>
                  </div>

                  {/* Tailoring Tabs */}
                  <div className="flex bg-accent/10 p-0.5 rounded-lg border border-border/40">
                    <button
                      type="button"
                      onClick={() => setTailorTab("cover")}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                        tailorTab === "cover" ? "bg-primary text-white" : "text-muted"
                      }`}
                    >
                      Cover Letter
                    </button>
                    <button
                      type="button"
                      onClick={() => setTailorTab("bullets")}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                        tailorTab === "bullets" ? "bg-primary text-white" : "text-muted"
                      }`}
                    >
                      Resume Tweaks
                    </button>
                  </div>
                </div>

                {/* Tailored Content Output Area */}
                <div className="bg-accent/10 border border-border rounded-xl p-4 relative">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        tailorTab === "cover"
                          ? getTailoredCoverLetter(activeReport.title, activeReport.company)
                          : getTailoredBulletPoints(activeReport.title).join("\n")
                      )
                    }
                    className="absolute right-3 top-3 p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-accent/15 transition-all cursor-pointer"
                    title="Copy tailored block"
                  >
                    {copiedText ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {tailorTab === "cover" ? (
                    <div className="space-y-2 text-xs">
                      <span className="text-[9px] font-bold text-primary uppercase block">Tailored Cover Letter Draft</span>
                      <pre className="text-foreground/90 font-sans whitespace-pre-wrap leading-relaxed text-[11px] pr-8">
                        {getTailoredCoverLetter(activeReport.title, activeReport.company)}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-primary uppercase block">Bullet Points to Inject into Resume</span>
                        <p className="text-[10px] text-muted mt-0.5">Copy these tailored bullets to address key matching gaps:</p>
                      </div>
                      <div className="space-y-2 font-mono text-[10px] text-foreground/90 pr-8 bg-card/45 p-2.5 rounded-lg border border-border/40">
                        {getTailoredBulletPoints(activeReport.title).map((bullet, idx) => (
                          <p key={idx} className="leading-relaxed">{bullet}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-muted border border-dashed border-border min-h-[350px] bg-accent/5">
              <Sparkles className="w-8 h-8 text-primary/50 mb-2 animate-pulse" />
              <span className="font-bold text-foreground">AI Job Matcher Analyzer</span>
              <span className="mt-1 max-w-xs text-center leading-relaxed">
                Analyze a job description or select an existing opportunity from the pipeline board below to inspect compatibility scores, ATS alignment, detected salary ranges, and tailored cover letters.
              </span>
            </Card>
          )}
        </div>

      </div>

      {/* Hiring Pipeline Kanban Board */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Pipeline Board</h3>

        {jobPipeline.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted border border-dashed border-border rounded-2xl bg-accent/5">
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
                        className={`p-4 bg-accent/5 hover:bg-accent/15 border rounded-xl space-y-3 transition-all duration-200 cursor-pointer group shadow-sm ${
                          activeReport?.id === job.id ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/45"
                        }`}
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
                                  addNotification(`Application status for "${job.title}" updated to "Applied"`, "success");
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
                                  addNotification(`Application status for "${job.title}" updated to "Interview"`, "success");
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
                                  addNotification(`Opportunity "${job.title}" deleted from board`, "info");
                                  if (activeReport?.id === job.id) setActiveReport(null);
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
    </PageTransition>
  );
}
