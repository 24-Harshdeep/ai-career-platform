"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  fetchJobs, 
  saveJob, 
  unsaveJob, 
  JobItem, 
  JobSearchParams 
} from "@/services/jobs.service";
import { useCareerStore } from "@/store/careerStore";
import { 
  Search, 
  MapPin, 
  Globe, 
  Clock, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  Filter, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  UserCheck
} from "lucide-react";

export default function JobsPage() {
  const user = useCareerStore((state) => state.user);
  const profile = useCareerStore((state) => state.profile);
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);

  const targetRole = profile?.targetRole || user?.goal || user?.role || "Full Stack Developer";

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [postedWithin, setPostedWithin] = useState<"24h" | "3d" | "7d" | "14d" | "30d" | "">("");
  const [providerFilter, setProviderFilter] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "match" | "relevance">("newest");
  
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [providersStatus, setProvidersStatus] = useState<Record<string, string>>({});
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [initialRoleLoaded, setInitialRoleLoaded] = useState(false);

  useEffect(() => {
    fetchDashboardData().finally(() => {
      setInitialRoleLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (initialRoleLoaded && !searchTerm && targetRole) {
      setSearchTerm(targetRole);
    }
  }, [initialRoleLoaded, targetRole]);

  const loadJobs = async (page = 1, customQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const qVal = customQuery !== undefined ? customQuery : (searchTerm.trim() || targetRole);
      const params: JobSearchParams = {
        q: qVal,
        location: locationTerm.trim(),
        remote: remoteOnly,
        postedWithin,
        provider: providerFilter,
        sort: sortBy,
        page,
        limit: 20
      };

      const data = await fetchJobs(params);
      setJobs(data.jobs || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      setProvidersStatus(data.providersStatus || {});
    } catch (err: any) {
      console.error("Error loading jobs:", err);
      setError(err.message || "Failed to discover jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRoleLoaded) {
      loadJobs(1);
    }
  }, [initialRoleLoaded, remoteOnly, postedWithin, providerFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs(1);
  };

  const handleToggleSave = async (e: React.MouseEvent, job: JobItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSavingJobId(job.id);
    try {
      if (job.isSaved) {
        await unsaveJob(job.id);
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, isSaved: false } : j)));
      } else {
        await saveJob(job.id);
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, isSaved: true } : j)));
      }
    } catch (err: any) {
      console.error("Error toggling save:", err);
    } finally {
      setSavingJobId(null);
    }
  };

  const formatTimeAgo = (dateStr?: string | null, fallbackDateStr?: string) => {
    const target = dateStr ? new Date(dateStr) : (fallbackDateStr ? new Date(fallbackDateStr) : null);
    if (!target || isNaN(target.getTime())) return null;

    const diffSeconds = Math.floor((new Date().getTime() - target.getTime()) / 1000);
    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `Posted ${Math.floor(diffSeconds / 60)} mins ago`;
    if (diffSeconds < 86400) return `Posted ${Math.floor(diffSeconds / 3600)} hours ago`;
    if (diffSeconds < 172800) return "Posted yesterday";
    if (diffSeconds < 2592000) return `Posted ${Math.floor(diffSeconds / 86400)} days ago`;

    return `Posted ${target.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  const getMatchBadgeStyle = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (score >= 65) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    return "bg-slate-500/10 text-slate-400 border-slate-500/30";
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-purple-900/20 to-card border border-border p-6 md:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CareerOS Intelligence Engine</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Multi-Source Job Intelligence
          </h1>
          <p className="text-muted text-sm md:text-base leading-relaxed">
            Discover opportunities across Adzuna, Greenhouse, Lever, Ashby, and company career pages matched directly against your Career DNA and Resume skills.
          </p>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <Link 
              href="/dashboard/jobs/saved"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-card hover:bg-accent text-xs font-semibold border border-border transition-colors"
            >
              <Bookmark className="w-4 h-4 text-primary" />
              <span>Saved Jobs & Applications</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Provider Status Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/50 border border-border/80 rounded-xl p-3 px-4 text-xs">
        <div className="flex items-center space-x-2 text-muted font-medium">
          <Layers className="w-4 h-4 text-primary" />
          <span>Active Data Sources:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {["adzuna", "greenhouse", "lever", "ashby"].map((prov) => {
            const isOk = providersStatus[prov] !== "failed";
            return (
              <div key={prov} className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-accent/40 border border-border/50">
                <div className={`w-2 h-2 rounded-full ${isOk ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                <span className="capitalize font-semibold text-foreground/90">{prov}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Control Bar */}
      <form onSubmit={handleSearchSubmit} className="space-y-4 bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Query input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Job title, keywords, or skills (e.g. React, Full Stack)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-muted/60"
            />
          </div>

          {/* Location input */}
          <div className="md:col-span-4 relative">
            <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="City, state, or country..."
              value={locationTerm}
              onChange={(e) => setLocationTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-muted/60"
            />
          </div>

          {/* Search CTA */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full h-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Remote Filter */}
            <button
              type="button"
              onClick={() => setRemoteOnly(!remoteOnly)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                remoteOnly
                  ? "bg-primary/20 text-primary border-primary/40 font-semibold"
                  : "bg-accent/30 text-muted hover:text-foreground border-border"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Remote Only</span>
            </button>

            {/* Recently Posted Time Filter */}
            <div className="flex items-center space-x-1 bg-accent/30 p-1 rounded-lg border border-border">
              <Clock className="w-3.5 h-3.5 ml-1.5 text-muted" />
              <span className="text-[11px] font-semibold text-muted mr-1">Posted:</span>
              {[
                { label: "Any time", value: "" },
                { label: "Last 24h", value: "24h" },
                { label: "Last 3 days", value: "3d" },
                { label: "Last 7 days", value: "7d" },
                { label: "Last 30 days", value: "30d" }
              ].map((timeOpt) => (
                <button
                  key={timeOpt.value}
                  type="button"
                  onClick={() => setPostedWithin(timeOpt.value as any)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    postedWithin === timeOpt.value
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted hover:text-foreground hover:bg-accent/60"
                  }`}
                >
                  {timeOpt.label}
                </button>
              ))}
            </div>

            {/* Provider Filter */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="px-3 py-1.5 bg-accent/30 border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="">All Sources</option>
              <option value="adzuna">Adzuna</option>
              <option value="greenhouse">Greenhouse</option>
              <option value="lever">Lever</option>
              <option value="ashby">Ashby</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-muted">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-accent/30 border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="newest">Recently Posted</option>
              <option value="match">CareerOS Match %</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>
        </div>
      </form>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted font-medium">
          Showing <span className="font-bold text-foreground">{jobs.length}</span> of <span className="font-bold text-foreground">{pagination.total}</span> discovered opportunities
        </p>
        {loading && (
          <div className="flex items-center space-x-2 text-xs text-primary font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Discovering latest jobs...</span>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && !error && (
        <div className="p-12 text-center bg-card border border-border rounded-xl space-y-4">
          <Briefcase className="w-12 h-12 text-muted mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No jobs found matching filters</h3>
            <p className="text-xs text-muted max-w-md mx-auto">
              Try broadening your search term, clearing location filters, or extending the publication timeframe.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchTerm("");
              setLocationTerm("");
              setRemoteOnly(false);
              setPostedWithin("");
              setProviderFilter("");
              setSortBy("newest");
            }}
            className="px-4 py-2 bg-accent hover:bg-accent/80 text-xs font-semibold rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Job Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => {
          const timeAgoLabel = formatTimeAgo(job.publishedAt, job.fetchedAt);
          const hasReliablePublishedAt = Boolean(job.publishedAt);
          const matchScore = job.match?.matchScore || 50;

          return (
            <div
              key={job.id || job.url}
              className="bg-card hover:border-primary/50 border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group space-y-4 relative"
            >
              {/* Card Header: Company, Title, Match Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-primary tracking-wide uppercase truncate">
                        {job.company.name}
                      </span>
                      {job.sources && job.sources.length > 1 && (
                        <span className="text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">
                          {job.sources.length} sources
                        </span>
                      )}
                    </div>
                    <Link href={`/dashboard/jobs/${job.id}`} className="block">
                      <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {job.title}
                      </h2>
                    </Link>
                  </div>

                  {/* Save Bookmark Button */}
                  <button
                    onClick={(e) => handleToggleSave(e, job)}
                    disabled={savingJobId === job.id}
                    title={job.isSaved ? "Unsave job" : "Save job"}
                    className="p-2 text-muted hover:text-primary hover:bg-accent rounded-lg transition-colors shrink-0"
                  >
                    {job.isSaved ? (
                      <BookmarkCheck className="w-5 h-5 text-primary fill-primary/20" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Meta details: Location, Remote, Time */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-muted/80" />
                    <span className="truncate max-w-[180px]">{job.location.raw || "Not specified"}</span>
                  </div>

                  {job.location.remote && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                      Remote
                    </span>
                  )}

                  {timeAgoLabel && (
                    <div className="flex items-center space-x-1 text-muted/70 text-[11px] ml-auto">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgoLabel}</span>
                    </div>
                  )}
                </div>

                {/* CareerOS Match Badge & Reasoning Summary */}
                <div className={`p-3 rounded-lg border flex items-center justify-between ${getMatchBadgeStyle(matchScore)}`}>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold">{matchScore}% CareerOS Match</span>
                  </div>

                  <span className="text-[11px] font-medium opacity-90 truncate max-w-[200px]">
                    {job.match?.reasons?.[0] || "Aligned with your target role"}
                  </span>
                </div>

                {/* Technical Skills Chips */}
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.skills.slice(0, 5).map((skill) => {
                      const isMatched = job.match?.matchedSkills?.includes(skill);
                      return (
                        <span
                          key={skill}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                            isMatched
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                              : "bg-accent/50 text-muted border-border"
                          }`}
                        >
                          {isMatched && "✓ "}
                          {skill}
                        </span>
                      );
                    })}
                    {job.skills.length > 5 && (
                      <span className="text-[11px] text-muted px-1.5 py-0.5">
                        +{job.skills.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Source Badge & View Button */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted font-medium capitalize">
                  Source: <span className="text-foreground font-semibold">{job.source || job.provider}</span>
                </span>

                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <span>View Match Breakdown</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            disabled={pagination.page <= 1}
            onClick={() => loadJobs(pagination.page - 1)}
            className="px-4 py-2 bg-card border border-border disabled:opacity-40 text-xs font-semibold rounded-lg hover:bg-accent transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-muted font-medium px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadJobs(pagination.page + 1)}
            className="px-4 py-2 bg-card border border-border disabled:opacity-40 text-xs font-semibold rounded-lg hover:bg-accent transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
