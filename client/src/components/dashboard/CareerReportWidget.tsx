"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { reportService, ReportSummaryDTO } from "@/services/report.service";
import { FileText, Download, TrendingUp, AlertTriangle, CheckCircle, Target, Sparkles, Loader2 } from "lucide-react";

export function CareerReportWidget() {
  const [summary, setSummary] = useState<ReportSummaryDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getReportSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await reportService.downloadReportPdf("shareable", summary?.targetRole || "Career");
    } catch (err: any) {
      alert("Failed to download PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex items-center justify-center space-x-3 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
        <span className="text-sm font-medium">Aggregating Central Career Intelligence...</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-slate-400">
        <p className="text-sm">Unable to load Career Report Widget: {error}</p>
        <button onClick={fetchSummary} className="mt-2 text-xs text-cyan-400 underline hover:text-cyan-300">Retry</button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Career Intelligence Report</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Central Brain snapshot for <span className="text-cyan-300 font-medium">{summary.targetRole}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/report"
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>View Full Report</span>
          </Link>

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Career Score</span>
          <div className="text-xl font-bold text-white mt-1">{summary.careerScore} / 100</div>
          <div className="text-[10px] text-cyan-400 mt-0.5 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 inline" />
            <span>{summary.growthText}</span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Readiness</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{summary.jobReadiness}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Role Matched</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Confidence</span>
          <div className="text-xl font-bold text-amber-400 mt-1">{summary.confidence}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Interview & Output</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Skill Gap Trajectory</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {summary.activeGaps} Active
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {summary.resolvedGaps} Resolved
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Lifecycle Managed</div>
        </div>
      </div>

      {summary.nextBestAction && (
        <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-lg p-3 flex items-start space-x-3">
          <Target className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-cyan-300">Recommended Next Step</div>
            <div className="text-xs text-slate-300 mt-0.5">{summary.nextBestAction}</div>
          </div>
        </div>
      )}
    </div>
  );
}
