"use client";

import React, { useEffect, useState } from "react";
import { reportService, CareerReportDTO, ReportSnapshotItem } from "@/services/report.service";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import { 
  LineChart, 
  Download, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  GraduationCap, 
  Map, 
  FileText, 
  FolderGit, 
  RefreshCw,
  Loader2,
  ShieldCheck,
  Zap,
  Briefcase,
  Layers,
  Code,
  Globe,
  Lock,
  Share2,
  History,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function CareerReportPage() {
  const [mode, setMode] = useState<"shareable" | "private">("shareable");
  const [report, setReport] = useState<CareerReportDTO | null>(null);
  const [snapshots, setSnapshots] = useState<ReportSnapshotItem[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("");
  const [isSnapshotView, setIsSnapshotView] = useState<boolean>(false);
  const [versionNum, setVersionNum] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [mode, selectedSnapshotId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const reportData = await reportService.getCareerReport(mode, selectedSnapshotId || undefined);
      
      let snapshotsData: ReportSnapshotItem[] = [];
      try {
        snapshotsData = await reportService.getSnapshots();
      } catch (snapErr) {
        console.warn("Snapshots list endpoint warning:", snapErr);
      }

      setReport(reportData.report);
      setIsSnapshotView(reportData.isSnapshot);
      setVersionNum(reportData.versionNumber);
      setSnapshots(Array.isArray(snapshotsData) ? snapshotsData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await reportService.downloadReportPdf(mode, report?.targetRole || "Career", selectedSnapshotId || undefined);
    } catch (err: any) {
      alert("Failed to download PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      setCreatingSnapshot(true);
      const newSnap = await reportService.createSnapshot(mode);
      alert(`Created ${newSnap.title} successfully!`);
      setSelectedSnapshotId(newSnap._id);
    } catch (err: any) {
      alert("Failed to create snapshot: " + err.message);
    } finally {
      setCreatingSnapshot(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="text-sm font-semibold text-slate-300">Compiling CareerOS Central Intelligence...</p>
        <p className="text-xs text-slate-500">Extracting verified artifacts, portfolio evidence, and skill trajectories.</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <p className="text-sm font-semibold text-slate-300">Unable to load report: {error}</p>
        <Button variant="secondary" onClick={loadData} className="text-xs">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Controls Header */}
      <StaggerItem>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                <LineChart className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {mode === "shareable" ? "Career Growth & Professional Profile" : "Private Intelligence Diagnostics"}
                  </h1>
                  {isSnapshotView && (
                    <Badge variant="warning">Snapshot v{versionNum}</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Candidate: <span className="text-slate-200 font-semibold">{report.candidateName}</span> &bull; Target Role: <span className="text-cyan-300 font-semibold">{report.targetRole}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Switcher Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => { setMode("shareable"); setSelectedSnapshotId(""); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === "shareable" 
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Shareable Growth Profile</span>
              </button>

              <button
                onClick={() => { setMode("private"); setSelectedSnapshotId(""); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === "private" 
                    ? "bg-purple-600 text-white shadow-md font-bold" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Private Diagnostics</span>
              </button>
            </div>

            {/* Version Snapshot Selector */}
            {Array.isArray(snapshots) && snapshots.length > 0 && (
              <select
                value={selectedSnapshotId}
                onChange={(e) => setSelectedSnapshotId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Live Report (Current)</option>
                {snapshots.map((snap) => (
                  <option key={snap._id} value={snap._id}>
                    v{snap.versionNumber} - {snap.targetRole} ({new Date(snap.generatedAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="secondary"
              onClick={handleCreateSnapshot}
              isLoading={creatingSnapshot}
              className="text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
            >
              <History className="w-4 h-4 mr-1.5 text-cyan-400" /> Save Version
            </Button>

            <Button
              variant="ai"
              onClick={handleDownloadPdf}
              isLoading={downloading}
              className="text-xs font-bold px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 border-none shadow-lg shadow-cyan-500/20"
            >
              <Download className="w-4 h-4 mr-1.5" /> Download PDF Report
            </Button>
          </div>
        </div>
      </StaggerItem>

      {/* MODE A: SHAREABLE CAREER GROWTH REPORT (CORPORATE RECRUITER-GRADE) */}
      {mode === "shareable" ? (
        <div className="space-y-8">
          {/* 7-Page Visual Navigator Bar */}
          <StaggerItem>
            <div className="flex flex-wrap items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs gap-1">
              {[
                { id: "page-1", label: "Page 1: Growth Profile" },
                { id: "page-2", label: "Page 2: Capabilities Matrix" },
                { id: "page-3", label: "Page 3: Projects & Experience" },
                { id: "page-4", label: "Page 4: Growth Telemetry" },
                { id: "page-5", label: "Page 5: Skill Lifecycles" },
                { id: "page-6", label: "Page 6: Action Plan" },
                { id: "page-7", label: "Page 7: Summary & Verification" }
              ].map((pageItem) => (
                <button
                  key={pageItem.id}
                  onClick={() => {
                    const el = document.getElementById(pageItem.id);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-all font-semibold text-[11px]"
                >
                  {pageItem.label}
                </button>
              ))}
            </div>
          </StaggerItem>

          {/* Notice Banner */}
          <StaggerItem>
            <div className="bg-cyan-950/40 border border-cyan-800/50 rounded-xl p-4 flex items-center justify-between text-xs text-cyan-200">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>
                  <strong>Recruiter-Authorized Shareable Report:</strong> Internal diagnostic scores and private interview mistakes are hidden by default. This document presents clean professional evidence, verified artifacts, and development lifecycles suitable for recruiters, hiring managers, and mentors.
                </span>
              </div>
            </div>
          </StaggerItem>

          {/* PAGE 1: CAREER GROWTH PROFILE */}
          <StaggerItem id="page-1">
            <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Page 1</span>
                  <h2 className="text-xl font-bold text-white">Professional Career Snapshot</h2>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  <div>Candidate: <strong className="text-slate-200">{report.candidateName}</strong></div>
                  <div>Period: <span className="text-slate-300">{report.reportPeriod}</span></div>
                </div>
              </div>

              {/* Candidate Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">Target Role</span>
                  <span className="font-bold text-cyan-300 text-sm">{report.targetRole}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Career Goal</span>
                  <span className="font-semibold text-slate-200">{report.careerGoal}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Experience Level</span>
                  <span className="font-semibold text-slate-200">{report.experienceLevel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Professional Links</span>
                  <div className="flex items-center space-x-3 mt-0.5">
                    {report.personalInfo?.githubUrl && (
                      <a href={report.personalInfo.githubUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                        GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {report.personalInfo?.linkedinUrl && (
                      <a href={report.personalInfo.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                        LinkedIn <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Factual Executive Profile */}
              <div className="bg-purple-950/30 border border-purple-800/40 p-5 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Professional Profile</span>
                </div>
                <p className="text-sm text-purple-100/90 leading-relaxed font-normal whitespace-pre-line">
                  {report.executiveSummary}
                </p>
              </div>

              {/* Career Direction Visual Flow */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Career Direction Trajectory</span>
                <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {report.careerDirectionVisual?.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200">
                        {step}
                      </div>
                      {idx < (report.careerDirectionVisual?.length || 0) - 1 && (
                        <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Secondary CareerOS Scores Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Career Score</span>
                  <div className="text-2xl font-extrabold text-white mt-1">{report.careerScore} / 100</div>
                  <span className="text-[10px] text-cyan-400 mt-1 block">{report.growth.growthText}</span>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Readiness</span>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">{report.jobReadiness}%</div>
                  <span className="text-[10px] text-emerald-300 mt-1 block">Role Matched</span>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confidence Score</span>
                  <div className="text-2xl font-extrabold text-amber-400 mt-1">{report.confidence}%</div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Grounded Output</span>
                </div>
              </div>

              {/* Confidence Contributor Breakdown */}
              {report.confidenceContributors && (
                <div className="bg-purple-950/40 border border-purple-800/50 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Confidence Score Contributor Breakdown</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Interview Perf.</span>
                      <span className="font-bold text-cyan-300">{report.confidenceContributors.interviewPerformance}%</span>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Project Evidence</span>
                      <span className="font-bold text-emerald-300">{report.confidenceContributors.projectEvidence}%</span>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Skill Matrix</span>
                      <span className="font-bold text-purple-300">{report.confidenceContributors.skillEvidence}%</span>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Consistency</span>
                      <span className="font-bold text-amber-300">{report.confidenceContributors.learningConsistency}%</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </StaggerItem>

          {/* PAGE 2: TECHNOLOGY & CAPABILITY MATRIX */}
          <StaggerItem id="page-2">
            <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Page 2</span>
                <h2 className="text-xl font-bold text-white">Technology & Capability Matrix</h2>
                <p className="text-xs text-slate-400 mt-1">Capabilities derived from verified evidence across resume, portfolio, GitHub, and learning roadmaps.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Frontend & Client Side", items: report.skillsMatrix?.frontend },
                  { title: "Backend & Systems", items: report.skillsMatrix?.backend },
                  { title: "Databases & Data Stores", items: report.skillsMatrix?.database },
                  { title: "Languages & Runtimes", items: report.skillsMatrix?.languages },
                  { title: "Engineering Practices & Tools", items: report.skillsMatrix?.engineering }
                ].map((group, gIdx) => (
                  <div key={gIdx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <Code className="w-4 h-4" /> {group.title}
                    </h3>

                    <div className="space-y-2">
                      {group.items && group.items.length > 0 ? (
                        group.items.map((skill, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-none">
                            <span className="font-semibold text-slate-200">{skill.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                {skill.level}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({Array.isArray(skill.evidence) ? skill.evidence.join(", ") : skill.evidence})
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">General development stack active.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </StaggerItem>

          {/* PAGE 3: EXPERIENCE & PROJECT EVIDENCE */}
          <StaggerItem id="page-3">
            <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Page 3</span>
                <h2 className="text-xl font-bold text-white">Experience & Project Evidence</h2>
                <p className="text-xs text-slate-400 mt-1">Professional employment history and verified project repository works.</p>
              </div>

              {/* Work Experience Sub-block */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Professional Experience</h3>
                {report.workExperience && report.workExperience.length > 0 ? (
                  <div className="space-y-4">
                    {report.workExperience.map((exp, eIdx) => (
                      <div key={eIdx} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-base font-bold text-white">{exp.position}</h4>
                            <span className="text-xs font-semibold text-cyan-400">{exp.company}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">{exp.startDate} – {exp.endDate}</span>
                        </div>

                        {exp.description && <p className="text-xs text-slate-300">{exp.description}</p>}

                        {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pt-1">
                            {exp.bulletPoints.map((bp, bIdx) => (
                              <li key={bIdx}>{bp}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">No formal employment experience uploaded yet. Target role implementation practice active.</p>
                  </div>
                )}
              </div>

              {/* Projects Sub-block */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Verified Projects</h3>
                {report.projects && report.projects.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {report.projects.map((proj, pIdx) => (
                      <div key={pIdx} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                          <div>
                            <h4 className="text-base font-bold text-white">{proj.name}</h4>
                            <span className="text-xs text-cyan-400 font-semibold">Role: {proj.role}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                            {proj.evidence}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {proj.techStack?.map((t, tIdx) => (
                              <span key={tIdx} className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded font-medium">
                                {t}
                              </span>
                            ))}
                          </div>

                          {proj.githubUrl && (
                            <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-cyan-400 font-semibold hover:underline flex items-center gap-1">
                              View Repository <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">No portfolio projects uploaded yet. Artifact tracking active.</p>
                  </div>
                )}
              </div>
            </Card>
          </StaggerItem>

          {/* PAGE 4: GROWTH & PROGRESS TELEMETRY */}
          <StaggerItem id="page-4">
            <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Page 4</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" /> Growth & Progress Telemetry
                </h2>
                <p className="text-xs text-slate-400 mt-1">Historical score tracking, roadmap milestone progress, and interview practice assessments.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Roadmap Progress</span>
                  <div className="flex items-center justify-between text-xs text-slate-200">
                    <span className="font-extrabold text-cyan-400 text-lg">{report.roadmapIntelligence?.completionPercentage || 0}%</span>
                    <span className="text-slate-400">{report.roadmapIntelligence?.completedModulesCount || 0} / {report.roadmapIntelligence?.totalModulesCount || 0} Modules</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(5, report.roadmapIntelligence?.completionPercentage || 0))}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Learning Streak</span>
                  <div className="text-xl font-extrabold text-amber-400 mt-1 flex items-center gap-1.5">
                    <Zap className="w-5 h-5 text-amber-400" /> {report.roadmapIntelligence?.streak || 0} Active Days
                  </div>
                  <span className="text-[10px] text-slate-400">Consistent technical implementation</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Certifications & Credentials</span>
                  <div className="text-sm font-semibold text-slate-200 mt-1">
                    {report.certifications && report.certifications.length > 0 ? (
                      <span className="text-emerald-400 font-bold">{report.certifications.length} Verified Credentials</span>
                    ) : (
                      <span className="text-slate-400 text-xs">Target Role Learning Track Active</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* PAGE 5: SKILL GAP LIFECYCLE */}
          <StaggerItem id="page-5">
            <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Page 5</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" /> Skill Gap Development Lifecycle
                </h2>
                <p className="text-xs text-slate-400 mt-1">Tracks development progress from target role identification to milestone completion.</p>
              </div>

              {report.shareableLifecycles && report.shareableLifecycles.length > 0 ? (
                <div className="space-y-4">
                  {report.shareableLifecycles.map((life, lIdx) => (
                    <div key={lIdx} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <h3 className="text-sm font-bold text-white">{life.skill}</h3>
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {life.currentState}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Action Taken</span>
                          <span>{life.actionTaken}</span>
                        </div>
                        <div>
                          <span className="text-cyan-400 block text-[10px] uppercase font-bold">Next Milestone</span>
                          <span>{life.nextMilestone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 text-center">
                  <p className="text-xs text-slate-400">Target role skill growth active. Complete interview sessions or roadmap modules to log dynamic skill lifecycles.</p>
                </div>
              )}
            </Card>
          </StaggerItem>

          {/* PAGE 6: STRATEGIC CAREER ACTION PLAN */}
          <StaggerItem id="page-6">
            <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Page 6</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" /> Strategic Career Action Plan
                </h2>
                <p className="text-xs text-slate-400 mt-1">Highest priority actions recommended by CareerOS Central Intelligence engine.</p>
              </div>

              <div className="space-y-4">
                {report.nextBestActions && report.nextBestActions.length > 0 ? (
                  report.nextBestActions.map((act, idx) => (
                    <div key={idx} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                            0{idx + 1}
                          </span>
                          <h3 className="text-sm font-bold text-white">{act.title}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={act.priority === "High" || act.priority === "HIGH" ? "warning" : "info"}>{act.priority} Priority</Badge>
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            Est. {act.estimatedTime}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{act.description}</p>
                      <div className="text-[10px] text-cyan-300 font-medium">Reasoning: {act.reason}</div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">Target role development recommendations active.</p>
                  </div>
                )}
              </div>
            </Card>
          </StaggerItem>

          {/* PAGE 7: PROFESSIONAL DEVELOPMENT SUMMARY */}
          <StaggerItem id="page-7">
            <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Page 7</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" /> Professional Development Summary & Verification
                </h2>
                <p className="text-xs text-slate-400 mt-1">Central Intelligence synthesis of overall candidate growth trajectory and readiness.</p>
              </div>

              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                <p className="text-xs text-slate-200 leading-relaxed">
                  CareerOS Central Intelligence tracks <strong className="text-white">{report.candidateName}</strong>'s growth trajectory across core computer science foundation, verified software projects, applied engineering experience, technical interview practice, and roadmap milestones toward <strong className="text-cyan-300">{report.targetRole}</strong>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Current Demonstrated Foundation</span>
                    <p className="text-slate-300 font-medium">
                      Verified capabilities in {report.targetRole} stack with hands-on project implementation and structured system design evaluations.
                    </p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-cyan-400 text-[10px] uppercase font-bold">Next Target Career Milestone</span>
                    <p className="text-slate-300 font-medium">
                      {report.careerGoal}
                    </p>
                  </div>
                </div>

                <div className="bg-cyan-950/40 border border-cyan-800/50 p-4 rounded-lg text-xs text-cyan-200 space-y-1 mt-4">
                  <strong className="block text-cyan-400 text-[10px] uppercase tracking-wider font-bold">Official CareerOS Verification Statement</strong>
                  <p className="italic text-[11px] text-cyan-100">
                    "This report represents the candidate's CareerOS development data for the selected reporting period. All metrics, evidence links, and technical assessment scores are generated directly from verified system context."
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* SECTION 7: TECHNICAL INTERVIEW PRACTICE & DEVELOPMENT */}
          <StaggerItem>
            <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Section 7</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" /> Technical Interview Practice & Assessment
                </h2>
                <p className="text-xs text-slate-400 mt-1">Simulated technical evaluations, architecture defenses, and core engineering concepts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Assessments Completed</span>
                  <span className="font-extrabold text-white text-xl mt-1 block">{report.interviewIntelligence?.completedCount || 0} Sessions</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Average Score</span>
                  <span className="font-extrabold text-cyan-400 text-xl mt-1 block">
                    {report.interviewIntelligence?.averageScore !== null && report.interviewIntelligence?.averageScore !== undefined
                      ? `${report.interviewIntelligence.averageScore}%`
                      : "Baseline Active"}
                  </span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Technical Performance</span>
                  <span className="font-extrabold text-emerald-400 text-xl mt-1 block">
                    {report.interviewIntelligence?.technicalScore !== null && report.interviewIntelligence?.technicalScore !== undefined
                      ? `${report.interviewIntelligence.technicalScore}%`
                      : "Verified"}
                  </span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Focus Areas Flagged</span>
                  <span className="font-extrabold text-amber-400 text-xl mt-1 block">
                    {report.interviewIntelligence?.repeatingMistakes?.length || 0} Topics
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Technical Development Topics Covered</h3>
                <div className="flex flex-wrap gap-2">
                  {report.interviewIntelligence?.topicsCovered && report.interviewIntelligence.topicsCovered.length > 0 ? (
                    report.interviewIntelligence.topicsCovered.map((topic, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg font-medium">
                        {topic}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Target role technical evaluation active.</span>
                  )}
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* SECTION 8: CAREER TRAJECTORY TIMELINE */}
          <StaggerItem>
            <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Section 8</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Map className="w-5 h-5 text-cyan-400" /> Career Trajectory Step-by-Step Pathway
                </h2>
                <p className="text-xs text-slate-400 mt-1">Sequential development progression from foundational learning to target role milestone.</p>
              </div>

              <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 py-2">
                {report.trajectoryTimeline && report.trajectoryTimeline.length > 0 ? (
                  report.trajectoryTimeline.map((step, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Step 0{idx + 1}</span>
                        <h3 className="text-sm font-bold text-white">{step.title}</h3>
                        <p className="text-xs text-slate-300">{step.detail}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 pl-4">Career trajectory milestone sequence active.</p>
                )}
              </div>
            </Card>
          </StaggerItem>

          {/* SECTION 9: CURRENT DEVELOPMENT PRIORITIES */}
          <StaggerItem>
            <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Section 9</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" /> Current Strategic Development Priorities
                </h2>
                <p className="text-xs text-slate-400 mt-1">High-impact actions recommended by CareerOS Central Intelligence engine.</p>
              </div>

              <div className="space-y-4">
                {report.nextBestActions && report.nextBestActions.length > 0 ? (
                  report.nextBestActions.map((act, idx) => (
                    <div key={idx} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <h3 className="text-sm font-bold text-white">{act.title}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={act.priority === "HIGH" ? "warning" : "info"}>{act.priority} Priority</Badge>
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            Est. {act.estimatedTime}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{act.description}</p>
                      <div className="text-[10px] text-cyan-300 font-medium">Reasoning: {act.reason}</div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">Target role development recommendations active.</p>
                  </div>
                )}
              </div>
            </Card>
          </StaggerItem>

          {/* SECTION 10: CAREEROS PROFESSIONAL DEVELOPMENT SUMMARY */}
          <StaggerItem>
            <Card className="p-8 bg-slate-900/90 border-slate-800 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">Section 10</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" /> CareerOS Professional Development Summary
                </h2>
                <p className="text-xs text-slate-400 mt-1">Central Intelligence synthesis of overall candidate growth trajectory and readiness.</p>
              </div>

              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                <p className="text-xs text-slate-200 leading-relaxed">
                  CareerOS Central Intelligence tracks <strong className="text-white">{report.candidateName}</strong>'s growth trajectory across core computer science foundation, verified software projects, applied engineering experience, technical interview practice, and roadmap milestones toward <strong className="text-cyan-300">{report.targetRole}</strong>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Current Demonstrated Foundation</span>
                    <p className="text-slate-300 font-medium">
                      Verified capabilities in {report.targetRole} stack with hands-on project implementation and structured system design evaluations.
                    </p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-cyan-400 text-[10px] uppercase font-bold">Next Target Career Milestone</span>
                    <p className="text-slate-300 font-medium">
                      {report.careerGoal}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </StaggerItem>
        </div>
      ) : (
        /* MODE B: PRIVATE CAREER INTELLIGENCE DIAGNOSTIC VIEW */
        <div className="space-y-6">
          <StaggerItem>
            <div className="bg-purple-950/40 border border-purple-800/50 rounded-xl p-4 flex items-center justify-between text-xs text-purple-200">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-purple-400 shrink-0" />
                <span>
                  <strong>Private Candidate Diagnostic View:</strong> Full internal intelligence mode showing Career Score breakdowns, ATS keyword gaps, repeating interview mistakes, and AI recommendations.
                </span>
              </div>
            </div>
          </StaggerItem>

          {/* Scores Grid */}
          <StaggerItem>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card className="p-5 bg-slate-900/80 border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Career Score</span>
                <div className="text-3xl font-extrabold text-white mt-1">{report.careerScore} / 100</div>
                <p className="text-xs text-cyan-400 mt-2">{report.growth.growthText}</p>
              </Card>

              <Card className="p-5 bg-slate-900/80 border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Job Readiness</span>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1">{report.jobReadiness}%</div>
                <p className="text-xs text-emerald-300 mt-2">{report.recommendationLevel}</p>
              </Card>

              <Card className="p-5 bg-slate-900/80 border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confidence Score</span>
                <div className="text-3xl font-extrabold text-amber-400 mt-1">{report.confidence}%</div>
                <p className="text-xs text-amber-300 mt-2">Internal AI Benchmark</p>
              </Card>
            </div>
          </StaggerItem>

          {/* Private Skill Gaps Table */}
          <StaggerItem>
            <Card className="p-6 bg-slate-900/80 border-slate-800">
              <h3 className="text-base font-bold text-white mb-4">Internal Skill Gap Diagnostics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3">Skill</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {report.skillGapLifecycle.map((gap, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-semibold text-slate-200">{gap.skill}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {gap.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-300">{gap.evidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </StaggerItem>
        </div>
      )}
    </PageTransition>
  );
}
