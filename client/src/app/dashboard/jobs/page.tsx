"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  fetchJobs, 
  fetchProviderHealth,
  saveJob, 
  unsaveJob, 
  JobItem, 
  JobSearchParams,
  ProviderHealth
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
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Briefcase,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  X,
  BookOpen,
  Zap,
  ShieldCheck,
  Building2,
  Award
} from "lucide-react";

export default function JobsPage() {
  const user = useCareerStore((state) => state.user);
  const profile = useCareerStore((state) => state.profile);
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);

  const targetRole = profile?.targetRole || user?.goal || user?.role || "Software Engineer";

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [counts, setCounts] = useState<{ recommended: number; goodMatch: number; stretch: number; recent: number; all: number }>({
    recommended: 0,
    goodMatch: 0,
    stretch: 0,
    recent: 0,
    all: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tabs & Search State
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [postedWithin, setPostedWithin] = useState<"24h" | "3d" | "7d" | "14d" | "30d" | "">("");
  const [providerFilter, setProviderFilter] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "match" | "relevance">("newest");
  
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [providerHealthMap, setProviderHealthMap] = useState<Record<string, ProviderHealth>>({});
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Drawer state for Match Breakdown
  const [selectedJobForDrawer, setSelectedJobForDrawer] = useState<JobItem | null>(null);

  useEffect(() => {
    fetchDashboardData().finally(() => {
      setInitialLoaded(true);
    });
    fetchProviderHealth()
      .then((health) => setProviderHealthMap(health))
      .catch((err) => console.error("Health fetch error:", err));
  }, []);

  useEffect(() => {
    if (initialLoaded && !searchTerm && targetRole) {
      setSearchTerm(targetRole);
    }
  }, [initialLoaded, targetRole]);

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
        category: activeTab !== "ALL" ? activeTab : "",
        sort: sortBy,
        page,
        limit: 20
      };

      const data = await fetchJobs(params);
      setJobs(data.jobs || []);
      if (data.counts) {
        setCounts(data.counts);
      }
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (err: any) {
      console.error("Error loading jobs:", err);
      setError(err.message || "Failed to discover jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialLoaded) {
      loadJobs(1);
    }
  }, [initialLoaded, activeTab, remoteOnly, postedWithin, providerFilter, sortBy]);

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
        if (selectedJobForDrawer && selectedJobForDrawer.id === job.id) {
          setSelectedJobForDrawer((prev) => prev ? { ...prev, isSaved: false } : null);
        }
      } else {
        await saveJob(job.id);
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, isSaved: true } : j)));
        if (selectedJobForDrawer && selectedJobForDrawer.id === job.id) {
          setSelectedJobForDrawer((prev) => prev ? { ...prev, isSaved: true } : null);
        }
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

  const getHealthBadge = (healthObj?: ProviderHealth) => {
    if (!healthObj) return { color: "bg-emerald-400", label: "HEALTHY" };
    switch (healthObj.status) {
      case "HEALTHY":
        return { color: "bg-emerald-400", label: "HEALTHY" };
      case "DEGRADED":
        return { color: "bg-amber-400", label: "DEGRADED" };
      case "UNCONFIGURED":
        return { color: "bg-slate-400", label: "UNCONFIGURED" };
      case "DISABLED":
        return { color: "bg-red-400", label: "DISABLED" };
      default:
        return { color: "bg-emerald-400", label: "HEALTHY" };
    }
  };

  const categoryTabs = [
    { id: "ALL", label: "All Opportunities", count: counts.all },
    { id: "RECOMMENDED", label: "Recommended For You", count: counts.recommended },
    { id: "GOOD MATCH", label: "Good Match", count: counts.goodMatch },
    { id: "STRETCH", label: "Stretch Opportunities", count: counts.stretch },
    { id: "RECENT", label: "Recent Opportunities", count: counts.recent }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto space-y-6 relative">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-purple-900/20 to-card border border-border p-6 md:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CareerOS Intelligence Engine</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            India-Aware Multi-Source Job Intelligence
          </h1>
          <p className="text-muted text-sm md:text-base leading-relaxed">
            Real-time developer opportunities across Jobvetta, IndianAPI, Jooble, Adzuna, Greenhouse, Lever, and Ashby synchronized directly with your Career DNA.
          </p>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <Link 
              href="/dashboard/jobs/saved"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-card hover:bg-accent text-xs font-semibold border border-border transition-colors"
            >
              <Bookmark className="w-4 h-4 text-primary" />
              <span>Saved Jobs & Tracker</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Source Health Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/60 border border-border/80 rounded-xl p-3 px-4 text-xs shadow-sm">
        <div className="flex items-center space-x-2 text-muted font-medium">
          <Layers className="w-4 h-4 text-primary" />
          <span>Active Provider Health:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {["jobvetta", "indianapi", "jooble", "adzuna", "greenhouse", "lever", "ashby"].map((provKey) => {
            const healthObj = providerHealthMap[provKey];
            const badge = getHealthBadge(healthObj);
            return (
              <div key={provKey} className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-accent/40 border border-border/50">
                <div className={`w-2 h-2 rounded-full ${badge.color} animate-pulse`} />
                <span className="capitalize font-semibold text-foreground/90">{provKey}</span>
                <span className="text-[10px] text-muted font-normal">({badge.label})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-border/70 overflow-x-auto pb-1 scrollbar-none">
        {categoryTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center space-x-2 border-t border-x ${
                isActive
                  ? "bg-card text-primary border-border border-b-transparent shadow-sm"
                  : "bg-transparent text-muted hover:text-foreground border-transparent hover:bg-accent/30"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-primary/20 text-primary" : "bg-accent text-muted"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Control Bar */}
      <form onSubmit={handleSearchSubmit} className="space-y-4 bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Query input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Target role, skills, or tech stack (e.g. Full Stack, React, Node)..."
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
              placeholder="Bengaluru, Gurugram, Mumbai, Remote..."
              value={locationTerm}
              onChange={(e) => setLocationTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-muted/60"
            />
          </div>

          {/* Search CTA */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full h-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>Discover</span>
            </button>
          </div>
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
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

            {/* Time Filter */}
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
              <option value="">All Provider Sources</option>
              <option value="jobvetta">Jobvetta</option>
              <option value="indianapi">IndianAPI</option>
              <option value="jooble">Jooble</option>
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
              <option value="match">7-Factor CareerOS Match %</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>
        </div>
      </form>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted font-medium">
          Showing <span className="font-bold text-foreground">{jobs.length}</span> of <span className="font-bold text-foreground">{pagination.total}</span> verified opportunities
        </p>
        {loading && (
          <div className="flex items-center space-x-2 text-xs text-primary font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Discovering real opportunities...</span>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && !error && (
        <div className="p-12 text-center bg-card border border-border rounded-xl space-y-4">
          <Briefcase className="w-12 h-12 text-muted mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No opportunities matching current criteria</h3>
            <p className="text-xs text-muted max-w-md mx-auto">
              Try adjusting your role query, clearing location filters, or switching to All Opportunities.
            </p>
          </div>
          <button
            onClick={() => {
              setActiveTab("ALL");
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
          const matchScore = job.match?.matchScore || 50;

          return (
            <div
              key={job.id || job.url}
              className="bg-card hover:border-primary/50 border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group space-y-4 relative"
            >
              <div className="space-y-3">
                {/* Header: Company, Sources, Save Button */}
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
                      {job.category && (
                        <span className="text-[10px] font-semibold bg-accent text-muted px-2 py-0.5 rounded-full">
                          {job.category}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedJobForDrawer(job)} 
                      className="block text-left w-full"
                    >
                      <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {job.title}
                      </h2>
                    </button>
                  </div>

                  {/* Bookmark CTA */}
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

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-muted/80" />
                    <span className="truncate max-w-[200px]">{job.normalizedLocation || job.location.raw || "India"}</span>
                  </div>

                  {(job.remoteType === "Remote" || job.location.remote) && (
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

                {/* Match Score & Reason Pill */}
                <div 
                  onClick={() => setSelectedJobForDrawer(job)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity ${getMatchBadgeStyle(matchScore)}`}
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold">{matchScore}% CareerOS Match</span>
                  </div>

                  <span className="text-[11px] font-medium opacity-90 truncate max-w-[220px]">
                    {job.match?.reasons?.[0] || "Aligned with target role"}
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

              {/* Card Footer */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted font-medium capitalize">
                  Provider: <span className="text-foreground font-semibold">{job.source || job.provider}</span>
                </span>

                <button
                  onClick={() => setSelectedJobForDrawer(job)}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <span>Match Breakdown</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
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

      {/* Interactive Match Breakdown Modal */}
      {selectedJobForDrawer && (
        <div 
          onClick={() => setSelectedJobForDrawer(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 transition-all"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="space-y-1 max-w-md">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">{selectedJobForDrawer.company.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-accent text-muted font-semibold capitalize">
                    {selectedJobForDrawer.source || selectedJobForDrawer.provider}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-foreground">{selectedJobForDrawer.title}</h2>
                <div className="flex items-center space-x-3 text-xs text-muted pt-1">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{selectedJobForDrawer.normalizedLocation || selectedJobForDrawer.location.raw}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Briefcase className="w-3.5 h-3.5 text-muted" />
                    <span>{selectedJobForDrawer.seniority || selectedJobForDrawer.experienceLevel}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedJobForDrawer(null)}
                className="p-2 rounded-lg bg-accent text-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 7-Factor Transparent Score Breakdown */}
            <div className="bg-gradient-to-r from-primary/10 via-purple-900/10 to-card border border-primary/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-primary font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>7-Factor Transparent CareerOS Match</span>
                </div>
                <span className="text-3xl font-black text-foreground">
                  {selectedJobForDrawer.match?.matchScore}%
                </span>
              </div>

              {/* Subscores Grid */}
              {selectedJobForDrawer.match?.subscores && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 text-xs">
                  <div className="p-2 bg-background/60 rounded border border-border/40">
                    <div className="text-muted text-[10px]">Role Match</div>
                    <div className="font-bold text-foreground">{selectedJobForDrawer.match.subscores.role} / 25</div>
                  </div>
                  <div className="p-2 bg-background/60 rounded border border-border/40">
                    <div className="text-muted text-[10px]">Seniority Fit</div>
                    <div className="font-bold text-foreground">{selectedJobForDrawer.match.subscores.seniority} / 20</div>
                  </div>
                  <div className="p-2 bg-background/60 rounded border border-border/40">
                    <div className="text-muted text-[10px]">Req. Skills</div>
                    <div className="font-bold text-foreground">{selectedJobForDrawer.match.subscores.requiredSkills} / 20</div>
                  </div>
                  <div className="p-2 bg-background/60 rounded border border-border/40">
                    <div className="text-muted text-[10px]">Experience</div>
                    <div className="font-bold text-foreground">{selectedJobForDrawer.match.subscores.experience} / 15</div>
                  </div>
                  <div className="p-2 bg-background/60 rounded border border-border/40">
                    <div className="text-muted text-[10px]">Location</div>
                    <div className="font-bold text-foreground">{selectedJobForDrawer.match.subscores.location} / 10</div>
                  </div>
                  <div className="p-2 bg-background/60 rounded border border-border/40">
                    <div className="text-muted text-[10px]">Freshness</div>
                    <div className="font-bold text-foreground">{selectedJobForDrawer.match.subscores.freshness} / 5</div>
                  </div>
                  <div className="p-2 bg-background/60 rounded border border-border/40">
                    <div className="text-muted text-[10px]">Trajectory</div>
                    <div className="font-bold text-foreground">{selectedJobForDrawer.match.subscores.trajectory} / 5</div>
                  </div>
                  {selectedJobForDrawer.match.subscores.seniorityPenalty ? (
                    <div className="p-2 bg-red-500/10 rounded border border-red-500/30">
                      <div className="text-red-400 text-[10px]">Seniority Penalty</div>
                      <div className="font-bold text-red-400">-{selectedJobForDrawer.match.subscores.seniorityPenalty} pts</div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Transparent Match Reasons */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Transparent Match Reasons</span>
              </h3>
              <ul className="space-y-2 text-xs">
                {selectedJobForDrawer.match?.reasons?.map((r, idx) => (
                  <li key={idx} className="p-2.5 bg-accent/30 rounded-lg border border-border/50 text-foreground/90 flex items-start space-x-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Required & Missing Skills + Roadmap Integration */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>Skill Gaps & Roadmap Status</span>
              </h3>

              {selectedJobForDrawer.match?.skillGaps && selectedJobForDrawer.match.skillGaps.length > 0 ? (
                <div className="space-y-3">
                  {selectedJobForDrawer.match.skillGaps.map((gap) => (
                    <div key={gap.skill} className="p-3 bg-accent/30 border border-border rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{gap.skill}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          gap.roadmapStatus === "Completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : gap.roadmapStatus === "In Progress"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                        }`}>
                          Roadmap: {gap.roadmapStatus || "Not Started"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted">{gap.reason}</p>
                      <p className="text-[11px] text-purple-300 font-medium">{gap.recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
                  ✓ Outstanding! You possess all required technical skills for this role.
                </div>
              )}
            </div>

            {/* Description Preview */}
            <div className="space-y-2 pt-2 border-t border-border">
              <h3 className="text-sm font-bold text-foreground">Job Description Summary</h3>
              <p className="text-xs text-muted leading-relaxed line-clamp-6">
                {selectedJobForDrawer.description}
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-3 sticky bottom-0 bg-card py-2">
              <button
                onClick={(e) => handleToggleSave(e, selectedJobForDrawer)}
                className="px-4 py-2 bg-accent hover:bg-accent/80 border border-border rounded-lg text-xs font-semibold flex items-center space-x-2"
              >
                <Bookmark className="w-4 h-4" />
                <span>{selectedJobForDrawer.isSaved ? "Saved" : "Save Job"}</span>
              </button>

              <a
                href={selectedJobForDrawer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center space-x-2 shadow-md"
              >
                <span>Apply on {selectedJobForDrawer.source || selectedJobForDrawer.provider}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
