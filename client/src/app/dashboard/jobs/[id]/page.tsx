"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  fetchJobById, 
  saveJob, 
  unsaveJob, 
  updateApplicationStatus, 
  JobItem 
} from "@/services/jobs.service";
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Globe, 
  Clock, 
  DollarSign, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  BookOpen,
  Send,
  Layers,
  ChevronRight,
  ShieldAlert
} from "lucide-react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [notes, setNotes] = useState("");

  const loadJob = async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobById(jobId);
      setJob(data);
      setNotes(data.notes || "");
    } catch (err: any) {
      console.error("Error loading job detail:", err);
      setError(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const handleToggleSave = async () => {
    if (!job) return;
    setSaving(true);
    try {
      if (job.isSaved) {
        await unsaveJob(job.id);
        setJob((prev) => prev ? { ...prev, isSaved: false, applicationStatus: null } : null);
      } else {
        await saveJob(job.id);
        setJob((prev) => prev ? { ...prev, isSaved: true, applicationStatus: "Saved" } : null);
      }
    } catch (err: any) {
      console.error("Error saving job:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: "Saved" | "Applied" | "Interview" | "Offer" | "Rejected") => {
    if (!job) return;
    setStatusUpdating(true);
    try {
      await updateApplicationStatus(job.id, newStatus, notes);
      setJob((prev) => prev ? { ...prev, isSaved: true, applicationStatus: newStatus } : null);
    } catch (err: any) {
      console.error("Error updating application status:", err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const formatPublishDate = (dateStr?: string | null) => {
    if (!dateStr) return "Not provided by source";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Not provided by source";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 max-w-5xl mx-auto flex items-center justify-center space-x-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-muted">Analyzing job description & matching skills...</span>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 max-w-5xl mx-auto space-y-4">
        <Link href="/dashboard/jobs" className="inline-flex items-center space-x-2 text-xs font-semibold text-primary">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Job Intelligence</span>
        </Link>
        <div className="p-8 bg-card border border-border rounded-xl text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-base font-bold text-foreground">{error || "Job posting not found"}</h2>
          <button
            onClick={() => router.push("/dashboard/jobs")}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
          >
            Return to Discovery
          </button>
        </div>
      </div>
    );
  }

  const match = job.match || {
    matchScore: 50,
    matchedSkills: [],
    missingSkills: [],
    roleMatch: true,
    experienceMatch: true,
    locationMatch: true,
    reasons: [],
    skillGaps: []
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discovery</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-card hover:bg-accent border border-border text-xs font-semibold transition-colors"
          >
            {job.isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-primary fill-primary/20" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-muted" />
                <span>Save Job</span>
              </>
            )}
          </button>

          {/* Primary CTA */}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors shadow-md"
          >
            <span>Apply on {job.source || job.provider}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/80 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-bold text-primary uppercase tracking-wide">
                {job.company.name}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent text-muted font-medium capitalize">
                Via {job.source || job.provider}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{job.location.raw || "Unspecified Location"}</span>
              </div>

              {job.location.remote && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                  Remote Allowed
                </span>
              )}

              <div className="flex items-center space-x-1">
                <Briefcase className="w-4 h-4 text-muted" />
                <span>{job.employmentType} ({job.experienceLevel})</span>
              </div>

              {job.salary?.min || job.salary?.max ? (
                <div className="flex items-center space-x-1 text-emerald-400 font-medium">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {job.salary.min ? `$${job.salary.min.toLocaleString()}` : ""} 
                    {job.salary.min && job.salary.max ? " - " : ""}
                    {job.salary.max ? `$${job.salary.max.toLocaleString()}` : ""} / {job.salary.period || "yr"}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center space-x-1 text-muted/70">
                <Clock className="w-3.5 h-3.5" />
                <span>Original Posting Date: {formatPublishDate(job.publishedAt)}</span>
              </div>
            </div>
          </div>

          {/* CareerOS Match Widget */}
          <div className="bg-gradient-to-br from-primary/10 via-purple-900/10 to-card border border-primary/30 p-5 rounded-xl md:w-72 shrink-0 text-center space-y-2">
            <div className="inline-flex items-center space-x-1 text-xs font-semibold text-primary uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>CareerOS Match</span>
            </div>
            <div className="text-4xl font-black text-foreground">
              {match.matchScore}%
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Calculated dynamically against your Career DNA, resume keywords, and experience level.
            </p>
          </div>
        </div>

        {/* Application Status Pipeline Bar */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Application Tracking Pipeline</h3>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Saved", value: "Saved" },
              { label: "Applied", value: "Applied" },
              { label: "Interviewing", value: "Interview" },
              { label: "Offer Received", value: "Offer" },
              { label: "Rejected", value: "Rejected" }
            ].map((st) => {
              const isSelected = job.applicationStatus === st.value;
              return (
                <button
                  key={st.value}
                  onClick={() => handleStatusChange(st.value as any)}
                  disabled={statusUpdating}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-accent/40 hover:bg-accent border-border text-muted"
                  }`}
                >
                  {isSelected && "✓ "}
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Match Reasoning + Jd Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Match & Skill Gap Analysis */}
        <div className="lg:col-span-5 space-y-6">
          {/* Match Reasons */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Why This Job Matches</span>
            </h2>

            <ul className="space-y-2 text-xs">
              {match.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-foreground/90 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Matched vs Missing Technical Skills */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Technical Skills Breakdown</span>
            </h2>

            {/* Matched Skills */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Matched Skills ({match.matchedSkills.length})</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {match.matchedSkills.length > 0 ? (
                  match.matchedSkills.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-medium">
                      ✓ {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted">No direct technical skills matched yet.</span>
                )}
              </div>
            </div>

            {/* Missing Skills / Skill Gaps */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Missing Skills / Target Gaps ({match.missingSkills.length})</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {match.missingSkills.length > 0 ? (
                  match.missingSkills.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-medium">
                      ⚠ {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-400 font-medium">Full skill coverage matched!</span>
                )}
              </div>
            </div>
          </div>

          {/* Skill Gap Roadmap Recommendations */}
          {match.skillGaps.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>Skill Gap Advice</span>
                </h2>
                <Link href="/roadmap" className="text-xs font-semibold text-primary hover:underline">
                  Open Roadmap →
                </Link>
              </div>

              <div className="space-y-3">
                {match.skillGaps.slice(0, 3).map((gap) => (
                  <div key={gap.skill} className="p-3 bg-accent/30 border border-border rounded-lg space-y-1">
                    <div className="text-xs font-bold text-foreground flex items-center space-x-1">
                      <span>Target Skill:</span>
                      <span className="text-primary">{gap.skill}</span>
                    </div>
                    <p className="text-[11px] text-muted leading-snug">{gap.reason}</p>
                    <p className="text-[11px] text-purple-300 font-medium pt-0.5">{gap.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Full Job Description */}
        <div className="lg:col-span-7 bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-base font-bold text-foreground">Job Description</h2>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center space-x-1"
            >
              <span>View Original Posting</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="prose prose-invert max-w-none text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans">
            {job.description}
          </div>

          {/* Footer CTA */}
          <div className="pt-6 border-t border-border flex items-center justify-between">
            <div className="text-xs text-muted">
              Source verified by <span className="font-semibold text-foreground capitalize">{job.source || job.provider}</span>
            </div>

            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors inline-flex items-center space-x-2 shadow-md"
            >
              <span>Apply on {job.source || job.provider}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
