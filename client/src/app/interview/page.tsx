"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useCareerStore, InterviewSessionData } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import PoweredBy from "@/components/ui/PoweredBy";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";
import {
  GraduationCap,
  Sparkles,
  Play,
  Send,
  AlertOctagon,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  Brain,
  Undo2,
  X,
  CheckCircle
} from "lucide-react";

export default function InterviewPrepPage() {
  const activeSession = useCareerStore((state) => state.activeInterviewSession);
  const currentQuestion = useCareerStore((state) => state.currentInterviewQuestion);
  const history = useCareerStore((state) => state.interviewSessions);
  const readiness = useCareerStore((state) => state.interviewReadiness);
  const mistakes = useCareerStore((state) => state.unresolvedMistakes);

  const fetchHistory = useCareerStore((state) => state.fetchInterviewHistory);
  const fetchReadiness = useCareerStore((state) => state.fetchInterviewReadiness);
  const startMockInterview = useCareerStore((state) => state.startMockInterview);
  const submitInterviewAnswer = useCareerStore((state) => state.submitInterviewAnswer);
  const concludeMockInterview = useCareerStore((state) => state.concludeMockInterview);
  const addNotification = useCareerStore((state) => state.addNotification);

  const [loading, setLoading] = useState(false);
  const [roleInput, setRoleInput] = useState("Backend Developer");
  const [typeInput, setTypeInput] = useState<any>("Technical");
  const [difficultyInput, setDifficultyInput] = useState<any>("Intermediate");
  const [questionCountInput, setQuestionCountInput] = useState(3);

  // Chat/Answer Input
  const [answerInput, setAnswerInput] = useState("");
  const [activeReport, setActiveReport] = useState<InterviewSessionData | null>(null);
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(null);

  // Timer states
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  const focusSkills = useMemo(() => {
    const roleLower = roleInput.toLowerCase();
    if (typeInput === "Behavioral") return "STAR Framework, Communication, Delivery";
    if (typeInput === "HR") return "Core Values, Collaboration, Salary Fit";
    if (typeInput === "System Design") return "Scalability, Database Indexing, Caching";
    
    if (roleLower.includes("backend")) {
      return "REST APIs, JWT Auth, MongoDB, Express";
    }
    if (roleLower.includes("frontend") || roleLower.includes("react")) {
      return "React 19, TypeScript, Next.js, Styling";
    }
    if (roleLower.includes("devops") || roleLower.includes("cloud")) {
      return "Docker, GitHub Actions, AWS Stack, CI/CD";
    }
    return "Data Structures, Logic flow, Clean code";
  }, [roleInput, typeInput]);

  const aiRecommendation = useMemo(() => {
    if (typeInput === "Behavioral") {
      return "Focus on structuring your scenarios with clear Situation, Task, Action, and Result indicators.";
    }
    if (typeInput === "HR") {
      return "Be ready to communicate career goals, motivators, and alignment with corporate culture values.";
    }
    if (typeInput === "System Design") {
      return "Focus on describing trade-offs (e.g. read/write database tuning, memory caching bottlenecks).";
    }
    return `Based on your Resume, Career DNA, and Roadmap, we'll evaluate backend authentication, modular coding logic, and schema indexing.`;
  }, [typeInput]);

  const sessionMistakes = useMemo(() => {
    if (!activeReport || !activeReport.questions) return [];
    const set = new Set<string>();
    activeReport.questions.forEach((q) => {
      if (q.feedback && q.feedback.missedConcepts) {
        q.feedback.missedConcepts.forEach((c) => set.add(c));
      }
    });
    return Array.from(set);
  }, [activeReport]);

  const getQuestionText = (q: any) => {
    if (q.questionText) return q.questionText;
    if (typeof q.questionId === "object" && q.questionId !== null && q.questionId.question) {
      return q.questionId.question;
    }
    
    const map: Record<string, string> = {
      "mock-q-1": "Explain the difference between a SQL join and an index scan. How do you optimize query speeds in MongoDB?",
      "mock-q-2": "How does JWT authentication work, and how do you secure user credentials?",
      "mock-q-3": "Explain how React's Virtual DOM works. What is the role of useEffect's cleanup function?",
      "mock-q-4": "Tell me about a time when you had to resolve a severe bug in production. How did you communicate with stakeholders?",
      "mock-q-5": "How do you design a scalable notification service that can handle millions of push notifications per day?"
    };
    return map[q.questionId] || "Explain your technical approach and architectural choices for this question.";
  };

  useEffect(() => {
    fetchHistory();
    fetchReadiness();
  }, [fetchHistory, fetchReadiness]);

  // Start question duration timer when question loads
  useEffect(() => {
    if (currentQuestion) {
      setSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion]);

  const handleStartSession = async () => {
    setLoading(true);
    const actualDifficulty = difficultyInput;
    const actualCount = difficultyInput === "Real Interview" ? 5 : questionCountInput;
    await startMockInterview(roleInput, typeInput, actualDifficulty, actualCount);
    addNotification("Interview simulation started. Formulate your response carefully.", "info");
    setLoading(false);
  };

  const handleSubmitAnswer = async () => {
    if (!answerInput.trim() || !activeSession) return;
    setLoading(true);
    await submitInterviewAnswer(activeSession.id, answerInput, seconds);
    setAnswerInput("");
    setLoading(false);
  };

  const handleFinishSession = async () => {
    if (!activeSession) return;
    setLoading(true);
    const completed = await concludeMockInterview(activeSession.id);
    if (completed) {
      setActiveReport(completed);
      addNotification("Interview concluded successfully. Dynamic scorecard generated.", "success");
    }
    setLoading(false);
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <PageTransition className="space-y-6 pb-12">
      <StaggerItem>
        <PageHeader 
          icon={GraduationCap}
          title="Interview Intelligence"
          description="Simulate mock rounds, receive analysis audits, and review recurring mistake logs."
        />
      </StaggerItem>

      {/* Grid: Simulator layout vs Aggregates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Mock Simulator / Config */}
        <div className="lg:col-span-8 space-y-6">
          {!activeSession ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <Card className="md:col-span-7 p-6 space-y-5">
                <div className="flex items-center space-x-2 border-b border-border pb-3">
                  <Play className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Configure Mock Interview</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Role Target</label>
                    <input
                      type="text"
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      placeholder="e.g. Backend Developer"
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Interview Category</label>
                    <select
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="Technical">Technical Coding</option>
                      <option value="Behavioral">Behavioral (STAR)</option>
                      <option value="System Design">System Design</option>
                      <option value="HR">HR Standard</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Complexity Level</label>
                    <select
                      value={difficultyInput}
                      onChange={(e) => setDifficultyInput(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Real Interview">Real Interview</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">No. of Questions</label>
                    <select
                      value={difficultyInput === "Real Interview" ? "5" : questionCountInput.toString()}
                      onChange={(e) => setQuestionCountInput(parseInt(e.target.value, 10))}
                      disabled={difficultyInput === "Real Interview"}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 disabled:opacity-50"
                    >
                      {difficultyInput === "Real Interview" ? (
                        <option value="5">5 (Fixed)</option>
                      ) : (
                        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num.toString()}>
                            {num}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <Button
                  variant="ai"
                  onClick={handleStartSession}
                  className="w-full text-sm font-semibold animate-pulse"
                  isLoading={loading}
                >
                  Initiate Mock Session
                </Button>
              </Card>

              {/* AI Interview Overview Card */}
              <Card className="md:col-span-5 p-6 space-y-4 bg-primary/5 border border-primary/20 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center space-x-1.5 border-b border-primary/10 pb-3">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">AI Interview Overview</h4>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="text-muted">Target Role</span>
                      <span className="font-bold text-foreground truncate max-w-[140px] text-right" title={roleInput}>{roleInput || "General Developer"}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="text-muted">Total Questions</span>
                      <span className="font-bold text-foreground">
                        {difficultyInput === "Real Interview" ? "5 (Adaptive)" : `${questionCountInput}`}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="text-muted">Est. Duration</span>
                      <span className="font-bold text-foreground">
                        {difficultyInput === "Real Interview" ? 30 : questionCountInput * 6} min
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="text-muted">Difficulty Prediction</span>
                      <span className={`font-bold uppercase ${
                        difficultyInput === "Advanced" || difficultyInput === "Real Interview"
                          ? "text-primary"
                          : "text-success"
                      }`}>
                        {difficultyInput}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="text-muted">Focus Areas</span>
                      <span className="font-bold text-foreground text-right truncate max-w-[140px]" title={focusSkills}>
                        {focusSkills}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="text-muted">Match Confidence</span>
                      <Badge variant="primary" className="text-[10px] font-bold">
                        {Math.min(96, readiness + 7)}%
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-card/45 border border-border/40 rounded-xl p-3 mt-2">
                  <span className="text-[9px] font-bold text-primary uppercase block mb-1">AI Recommendation</span>
                  <p className="text-[10px] text-muted leading-relaxed">
                    {aiRecommendation}
                  </p>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-6 space-y-5 border-primary/20">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-xs font-bold text-foreground">{formatTime(seconds)}</span>
                </div>
                <Badge variant="warning">{activeSession.type}</Badge>
              </div>

              {currentQuestion ? (
                <div className="space-y-4">
                  <div className="bg-accent/10 border border-border p-4 rounded-2xl">
                    <p className="text-xs text-muted uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5 text-primary" />
                      <span>Current Question</span>
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-relaxed">
                      {currentQuestion.text}
                    </p>
                  </div>

                  {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                    <div className="text-[11px] text-muted leading-relaxed italic bg-card p-3 border border-border rounded-xl">
                      <strong>Coach Hint:</strong> {currentQuestion.hints[0]}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Formulate Answer</label>
                    <textarea
                      rows={5}
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Type your coding explanation or STAR behavioral answer here..."
                      className="w-full bg-accent/15 border border-border outline-none rounded-2xl p-3 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>

                  <Button
                    variant="ai"
                    onClick={handleSubmitAnswer}
                    disabled={!answerInput.trim() || loading}
                    className="w-full text-sm font-semibold"
                    isLoading={loading}
                  >
                    Submit Answer
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <p className="text-sm font-semibold text-foreground">
                    All questions in this round have been answered. Get ready for your scorecard!
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleFinishSession}
                    className="px-8 text-sm font-bold"
                    isLoading={loading}
                  >
                    Generate Interview Report
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Active Completed Scorecard */}
          {/* Active Completed Scorecard */}
          {activeReport && (
            <Card className="p-6 space-y-6 relative border-success/35">
              <button
                onClick={() => setActiveReport(null)}
                className="absolute right-4 top-4 text-muted hover:text-foreground cursor-pointer p-1 rounded-lg hover:bg-accent/15"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-black text-foreground leading-tight">Mock Evaluation Scorecard</h3>
                  <p className="text-xs text-muted mt-1 font-bold">{activeReport.role} • {activeReport.type} ({activeReport.difficulty})</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-success">{activeReport.overallScore}%</span>
                  <p className="text-[9px] text-muted uppercase tracking-wider font-extrabold">Overall Rating</p>
                </div>
              </div>

              {/* Subscores Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-b border-border pb-4">
                <div className="bg-accent/5 p-3 rounded-xl text-center">
                  <p className="text-[9px] text-muted uppercase font-bold">Overall</p>
                  <p className="font-black text-foreground mt-1 text-base">{activeReport.overallScore}%</p>
                </div>
                <div className="bg-accent/5 p-3 rounded-xl text-center">
                  <p className="text-[9px] text-muted uppercase font-bold">Technical</p>
                  <p className="font-black text-foreground mt-1 text-base">{activeReport.technicalScore}%</p>
                </div>
                <div className="bg-accent/5 p-3 rounded-xl text-center">
                  <p className="text-[9px] text-muted uppercase font-bold">Communication</p>
                  <p className="font-black text-foreground mt-1 text-base">{activeReport.communicationScore}%</p>
                </div>
                <div className="bg-accent/5 p-3 rounded-xl text-center">
                  <p className="text-[9px] text-muted uppercase font-bold">Problem Solving</p>
                  <p className="font-black text-foreground mt-1 text-base">{activeReport.problemSolvingScore}%</p>
                </div>
                <div className="bg-accent/5 p-3 rounded-xl text-center">
                  <p className="text-[9px] text-muted uppercase font-bold">Code Quality</p>
                  <p className="font-black text-foreground mt-1 text-base">{activeReport.timeManagementScore}%</p>
                </div>
              </div>

              {/* Career Impact Projections */}
              <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-success uppercase block">Career Engine Projections</span>
                  <span className="text-[11px] text-muted mt-0.5 block">Completing this interview unlocks direct readiness score enhancements.</span>
                </div>
                <div className="flex gap-4">
                  <div className="bg-success/10 border border-success/30 px-3 py-1.5 rounded-lg text-center shrink-0">
                    <span className="text-[9px] text-success/80 font-bold block uppercase">Career Score</span>
                    <span className="text-xs font-extrabold text-success">+{Math.round(activeReport.overallScore / 25)} pts</span>
                  </div>
                  <div className="bg-success/10 border border-success/30 px-3 py-1.5 rounded-lg text-center shrink-0">
                    <span className="text-[9px] text-success/80 font-bold block uppercase">Interview Readiness</span>
                    <span className="text-xs font-extrabold text-success">+{activeReport.readinessIncrease || 5}%</span>
                  </div>
                </div>
              </div>

              {/* AI Expert Review Summary */}
              <div className="space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-primary uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Expert Review Summary</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed bg-accent/10 p-3.5 border border-border rounded-xl">
                  {activeReport.feedbackSummary}
                </p>
              </div>

              {/* Missed Concepts & Gaps logs */}
              {sessionMistakes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Detected Mistakes & Concept Gaps</span>
                  <div className="flex flex-wrap gap-1.5">
                    {sessionMistakes.map((mis, idx) => (
                      <Badge key={idx} variant="warning" className="text-[10px]">
                        {mis}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Learning Modules */}
              {activeReport.recommendations.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Suggested learning modules</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeReport.recommendations.map((rec, i) => (
                      <div key={i} className="p-3 bg-accent/10 border border-border/60 rounded-xl text-xs flex items-center space-x-2">
                        <TrendingUp className="w-4.5 h-4.5 text-primary shrink-0" />
                        <span className="text-foreground font-semibold">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question & Answer Transcripts Section */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-secondary uppercase">
                  <Brain className="w-4 h-4" />
                  <span>Q&A Transcript & Coach Evaluations</span>
                </div>

                <div className="space-y-3">
                  {activeReport.questions.map((q, idx) => {
                    const isExpanded = expandedQuestionIdx === idx;
                    const questionText = getQuestionText(q);
                    return (
                      <div key={idx} className="border border-border/80 rounded-2xl overflow-hidden bg-accent/5">
                        <button
                          type="button"
                          onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}
                          className="w-full text-left p-4 flex items-center justify-between hover:bg-accent/10 transition-colors"
                        >
                          <div className="space-y-1 pr-4">
                            <span className="text-[9px] font-bold text-primary uppercase block">Question {idx + 1}</span>
                            <span className="text-xs font-bold text-foreground line-clamp-1">{questionText}</span>
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
                              <span className="text-[9px] font-bold text-muted uppercase">Your Answered Explanation</span>
                              <p className="p-3 bg-accent/10 border border-border/40 rounded-xl leading-relaxed text-foreground/90 font-mono text-[11px] whitespace-pre-wrap">
                                {q.answer || "No response provided."}
                              </p>
                            </div>

                            {q.feedback && (
                              <div className="space-y-3 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-success uppercase block">Response Strengths</span>
                                    <ul className="list-disc list-inside space-y-0.5 text-muted text-[11px]">
                                      {q.feedback.strengths && q.feedback.strengths.length > 0 ? (
                                        q.feedback.strengths.map((str, sIdx) => <li key={sIdx}>{str}</li>)
                                      ) : (
                                        <li>Strong initial articulation.</li>
                                      )}
                                    </ul>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-warning uppercase block">Response Weaknesses</span>
                                    <ul className="list-disc list-inside space-y-0.5 text-muted text-[11px]">
                                      {q.feedback.weaknesses && q.feedback.weaknesses.length > 0 ? (
                                        q.feedback.weaknesses.map((weak, wIdx) => <li key={wIdx}>{weak}</li>)
                                      ) : (
                                        <li>No major architectural issues detected.</li>
                                      )}
                                    </ul>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-primary uppercase block">Coach Improvement Advice</span>
                                  <p className="text-muted leading-relaxed">{q.feedback.improvementPlan || "Focus on elaborating the edge cases and scaling limitations."}</p>
                                </div>

                                <div className="space-y-1.5">
                                  <span className="text-[9px] font-bold text-success uppercase block">Ideal Mock Answer Suggestion</span>
                                  <p className="p-3 bg-success/5 border border-success/20 rounded-xl text-[11px] leading-relaxed text-foreground/90 italic">
                                    {q.feedback.idealAnswer || "Cover details about indexing mechanisms, security best practices, and runtime complexities."}
                                  </p>
                                </div>

                                {q.feedback.resources && q.feedback.resources.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-secondary uppercase block">Suggested Study Materials</span>
                                    <div className="flex flex-wrap gap-2">
                                      {q.feedback.resources.map((res, rIdx) => (
                                        <a
                                          key={rIdx}
                                          href={res}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[10px] text-primary hover:underline font-semibold bg-primary/5 px-2 py-0.5 rounded border border-primary/20"
                                        >
                                          Reference Documentation
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Readiness Stats & Mistakes */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="insight" className="p-6 text-center space-y-3">
            <div className="flex justify-center">
              <Award className="w-10 h-10 text-primary" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-foreground">{readiness}%</span>
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-0.5">Interview Readiness Index</p>
            </div>
          </Card>

          {/* Mistakes Logger Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <AlertOctagon className="w-5 h-5 text-warning shrink-0" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Weak Areas & Concept Mistakes</h3>
            </div>

            {mistakes.length === 0 ? (
              <p className="text-xs text-muted text-center py-2">
                No recurring mistakes logged yet. Complete mock rounds to compile warning areas.
              </p>
            ) : (
              <div className="space-y-3">
                {mistakes.map((mis, idx) => (
                  <div key={idx} className="p-3 bg-accent/10 border border-border rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-foreground">{mis.concept}</p>
                      <p className="text-[10px] text-muted mt-0.5">Logged {mis.frequency} times</p>
                    </div>
                    <Badge variant={mis.severity === "High" ? "warning" : "muted"}>
                      {mis.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Session history list */}
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Previous Sessions</h3>
            {history.length === 0 ? (
              <p className="text-xs text-muted text-center py-2">No history records found.</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 4).map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => setActiveReport(sess)}
                    className="p-3 bg-accent/5 hover:bg-accent/15 border border-border rounded-xl flex items-center justify-between text-xs transition-all duration-200 cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{sess.role}</p>
                      <p className="text-[10px] text-muted mt-0.5">{sess.type} • {sess.difficulty}</p>
                    </div>
                    <span className="font-bold text-foreground">{sess.overallScore}%</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
