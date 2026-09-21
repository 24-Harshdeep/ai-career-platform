"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  fetchSavedJobs, 
  unsaveJob, 
  updateApplicationStatus, 
  JobItem 
} from "@/services/jobs.service";
import { 
  Bookmark, 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  Trash2, 
  ChevronRight,
  Briefcase,
  Layers,
  CheckCircle2
} from "lucide-react";

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");

  const loadSaved = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSavedJobs();
      setJobs(data);
    } catch (err: any) {
      console.error("Error loading saved jobs:", err);
      setError(err.message || "Failed to load saved jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const handleUnsave = async (jobId: string) => {
    try {
      await unsaveJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err: any) {
      console.error("Error unsaving job:", err);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: "Saved" | "Applied" | "Interview" | "Offer" | "Rejected") => {
    try {
      await updateApplicationStatus(jobId, newStatus);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, applicationStatus: newStatus } : j))
      );
    } catch (err: any) {
      console.error("Error updating status:", err);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "All") return true;
    return job.applicationStatus === activeTab;
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-primary hover:underline mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Job Intelligence</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center space-x-3">
            <Bookmark className="w-7 h-7 text-primary" />
            <span>Saved Jobs & Applications</span>
          </h1>
          <p className="text-xs md:text-sm text-muted">
            Track your bookmarked opportunities and manage your active application pipeline stage.
          </p>
        </div>

        <Link
          href="/dashboard/jobs"
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors inline-flex items-center space-x-2 self-start md:self-auto"
        >
          <span>Discover More Jobs</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Pipeline Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {[
          { label: "All Saved", value: "All" },
          { label: "Saved Only", value: "Saved" },
          { label: "Applied", value: "Applied" },
          { label: "Interviewing", value: "Interview" },
          { label: "Offers", value: "Offer" },
          { label: "Rejected", value: "Rejected" }
        ].map((tab) => {
          const isSelected = activeTab === tab.value;
          const count = tab.value === "All" ? jobs.length : jobs.filter((j) => j.applicationStatus === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-accent/30 text-muted hover:bg-accent hover:text-foreground border border-border/50"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-background/40">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center text-xs text-muted font-medium">
          Loading saved jobs & applications...
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredJobs.length === 0 && (
        <div className="p-12 bg-card border border-border rounded-xl text-center space-y-3">
          <Briefcase className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-foreground">No saved jobs found in this stage</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Bookmark opportunities from the Job Intelligence page to track applications here.
          </p>
          <Link
            href="/dashboard/jobs"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
          >
            Explore Jobs
          </Link>
        </div>
      )}

      {/* Saved Jobs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-primary uppercase">{job.company.name}</span>
                  <Link href={`/dashboard/jobs/${job.id}`} className="block">
                    <h2 className="text-base font-bold text-foreground hover:text-primary transition-colors">
                      {job.title}
                    </h2>
                  </Link>
                </div>

                <button
                  onClick={() => handleUnsave(job.id)}
                  title="Remove from saved"
                  className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{job.location.raw || "Unspecified"}</span>
                </div>
                {job.location.remote && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                    Remote
                  </span>
                )}
                <span className="text-emerald-400 font-semibold ml-auto">
                  {job.match?.matchScore || 50}% Match
                </span>
              </div>
            </div>

            {/* Application Pipeline Stage Control */}
            <div className="pt-3 border-t border-border/60 space-y-2">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Status Stage:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: "Saved", value: "Saved" },
                  { label: "Applied", value: "Applied" },
                  { label: "Interview", value: "Interview" },
                  { label: "Offer", value: "Offer" },
                  { label: "Rejected", value: "Rejected" }
                ].map((st) => {
                  const isSelected = job.applicationStatus === st.value;
                  return (
                    <button
                      key={st.value}
                      onClick={() => handleStatusChange(job.id, st.value as any)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "bg-accent/20 text-muted border-border hover:bg-accent"
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <Link
                href={`/dashboard/jobs/${job.id}`}
                className="text-primary hover:underline font-semibold"
              >
                View Match Analysis →
              </Link>

              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-muted hover:text-foreground font-medium"
              >
                <span>Apply Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
