"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";
import {
  Award,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Brain,
  ChevronRight,
  TrendingUp,
  ArrowLeft,
  FileText,
  Target,
  BookOpen
} from "lucide-react";

export default function InterviewReportPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;

  const fetchSessionReport = useCareerStore((state) => state.fetchSessionReport);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQIdx, setExpandedQIdx] = useState<number | null>(0);

  useEffect(() => {
    async function load() {
      if (!sessionId) return;
      setLoading(true);
      const data = await fetchSessionReport(sessionId);
      if (data) {
        setReport(data);
      }
      setLoading(false);
    }
    load();
  }, [sessionId, fetchSessionReport]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Sparkles className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-foreground">Compiling Final Interview Scorecard & Analytics...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Interview Report Not Found</h3>
        <p className="text-xs text-muted">The requested interview report could not be loaded or is invalid.</p>
        <Link href="/interview">
          <Button variant="primary" size="md">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Interview Intelligence
          </Button>
        </Link>
      </div>
    );
  }

  const subscores = report.subscores || {
    technicalKnowledge: report.overallScore || 75,
    problemSolving: report.overallScore || 75,
    communication: report.overallScore || 80,
    answerRelevance: report.overallScore || 85,
    completeness: report.overallScore || 70,
    clarity: report.overallScore || 80
  };

  return (
    <PageTransition className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header Bar */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <PageHeader
            icon={Award}
            title="Interview Performance Report"
            description={`${report.role} • ${report.type} Round (${report.difficulty} Level)`}
          />

          <Link href="/interview">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard
            </Button>
          </Link>
        </div>
      </StaggerItem>

      {/* Main Scorecard Header Card */}
      <Card className="p-6 space-y-6 border-success/35">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-2">
            <Badge variant="success">Final Evaluation Complete</Badge>
            <h2 className="text-2xl font-black text-foreground">Overall Readiness Rating</h2>
            <p className="text-xs text-muted max-w-lg">
              Evaluated using CareerOS Adaptive Scoring, verified context verification, and multi-dimensional analysis.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-accent/10 border border-border p-5 rounded-2xl shrink-0">
            <div className="text-center">
              <span className="text-4xl font-black text-success">{report.overallScore}%</span>
              <p className="text-[10px] text-muted uppercase font-bold tracking-wider mt-1">Overall Match</p>
            </div>
          </div>
        </div>

        {/* 6 Subscores Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
            <span className="text-[9px] font-bold text-muted uppercase">Technical</span>
            <p className="text-base font-black text-foreground">{subscores.technicalKnowledge}%</p>
          </div>
          <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
            <span className="text-[9px] font-bold text-muted uppercase">Problem Solving</span>
            <p className="text-base font-black text-foreground">{subscores.problemSolving}%</p>
          </div>
          <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
            <span className="text-[9px] font-bold text-muted uppercase">Communication</span>
            <p className="text-base font-black text-foreground">{subscores.communication}%</p>
          </div>
          <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
            <span className="text-[9px] font-bold text-muted uppercase">Relevance</span>
            <p className="text-base font-black text-foreground">{subscores.answerRelevance}%</p>
          </div>
          <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
            <span className="text-[9px] font-bold text-muted uppercase">Completeness</span>
            <p className="text-base font-black text-foreground">{subscores.completeness}%</p>
          </div>
          <div className="p-3 bg-accent/5 border border-border rounded-xl text-center space-y-1">
            <span className="text-[9px] font-bold text-muted uppercase">Clarity</span>
            <p className="text-base font-black text-foreground">{subscores.clarity}%</p>
          </div>
        </div>

        {/* Next Best Action Banner */}
        <div className="bg-primary/10 border border-primary/25 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Recommended Next Best Action</span>
            <p className="text-xs font-semibold text-foreground">{report.nextBestAction || "Practice backend error propagation and schema indexing."}</p>
          </div>
          <Link href="/roadmap">
            <Button variant="primary" size="sm" className="shrink-0">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Open Learning Roadmap
            </Button>
          </Link>
        </div>
      </Card>

      {/* Grid: Strengths & Weak Areas vs Q&A Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Strengths & Weak Concept Logs */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-success" /> Demonstrated Strengths
            </h3>
            <div className="space-y-2">
              {(report.strengths || ["Solid communication", "Clear explanation of REST standards"]).map((str: string, i: number) => (
                <div key={i} className="p-3 bg-success/5 border border-success/20 rounded-xl text-xs text-foreground font-medium">
                  {str}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-warning" /> Weak Areas & Gaps
            </h3>
            <div className="space-y-2">
              {(report.weakAreas || ["Error handling", "Database indexing patterns"]).map((weak: string, i: number) => (
                <div key={i} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-foreground font-medium">
                  {weak}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Q&A Transcripts Accordion */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-primary" /> Q&A Transcript & Coach Evaluations
            </h3>

            <div className="space-y-3">
              {(report.qaAnalysis || []).map((q: any, idx: number) => {
                const isExpanded = expandedQIdx === idx;
                return (
                  <div key={idx} className="border border-border/80 rounded-2xl overflow-hidden bg-accent/5">
                    <button
                      type="button"
                      onClick={() => setExpandedQIdx(isExpanded ? null : idx)}
                      className="w-full text-left p-4 flex items-center justify-between hover:bg-accent/10 transition-colors"
                    >
                      <div className="space-y-1 pr-4">
                        <span className="text-[9px] font-bold text-primary uppercase block">Question {idx + 1}</span>
                        <span className="text-xs font-bold text-foreground line-clamp-1">{q.question}</span>
                      </div>
                      <div className="flex items-center space-x-2.5 shrink-0">
                        <Badge variant={q.score >= 80 ? "success" : q.score >= 70 ? "warning" : "muted"} className="text-[10px] font-bold">
                          {q.score}% Score
                        </Badge>
                        <ChevronRight className={`w-4 h-4 text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 bg-card border-t border-border/60 space-y-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-muted uppercase">Candidate Answer</span>
                          <p className="p-3 bg-accent/10 border border-border/40 rounded-xl leading-relaxed text-foreground/90 font-mono text-[11px] whitespace-pre-wrap">
                            {q.answer || "No response provided."}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-primary uppercase block">Coach Advice</span>
                          <p className="text-muted leading-relaxed">{q.coachAdvice || "Focus on elaborating edge cases and error handling."}</p>
                        </div>

                        {q.idealAnswer && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-success uppercase block">Ideal Answer Suggestion</span>
                            <p className="p-3 bg-success/5 border border-success/20 rounded-xl text-[11px] leading-relaxed text-foreground/90 italic">
                              {q.idealAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
