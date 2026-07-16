"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCareerStore, InterviewSessionData } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
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
  X
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

  // Chat/Answer Input
  const [answerInput, setAnswerInput] = useState("");
  const [activeReport, setActiveReport] = useState<InterviewSessionData | null>(null);

  // Timer states
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<any>(null);

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
    await startMockInterview(roleInput, typeInput, difficultyInput);
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
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Interview Intelligence</h2>
          <p className="text-xs text-muted">Simulate mock rounds, receive analysis audits, and review recurring mistake logs.</p>
        </div>
      </div>

      {/* Grid: Simulator layout vs Aggregates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Mock Simulator / Config */}
        <div className="lg:col-span-8 space-y-6">
          {!activeSession ? (
            <Card className="p-6 space-y-5">
              <div className="flex items-center space-x-2 border-b border-border pb-3">
                <Play className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Configure Mock Interview</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <option value="Junior">Junior</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>

              <Button
                variant="ai"
                onClick={handleStartSession}
                className="w-full text-sm font-semibold"
                isLoading={loading}
              >
                Initiate Mock Session
              </Button>
            </Card>
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
          {activeReport && (
            <Card className="p-6 space-y-5 relative border-success/35">
              <button
                onClick={() => setActiveReport(null)}
                className="absolute right-4 top-4 text-muted hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground leading-tight">Mock Evaluation</h3>
                  <p className="text-xs text-muted mt-1 font-semibold">{activeReport.role} ({activeReport.type})</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-success">{activeReport.overallScore}%</span>
                  <p className="text-[9px] text-muted uppercase tracking-wider font-bold">Overall Rating</p>
                </div>
              </div>

              {/* Subscores Grid */}
              <div className="grid grid-cols-4 gap-4 text-center text-xs border-b border-border pb-4">
                <div className="bg-accent/5 p-2 rounded-xl">
                  <p className="text-[9px] text-muted uppercase font-bold">Technical</p>
                  <p className="font-bold text-foreground mt-0.5">{activeReport.technicalScore}%</p>
                </div>
                <div className="bg-accent/5 p-2 rounded-xl">
                  <p className="text-[9px] text-muted uppercase font-bold">Communication</p>
                  <p className="font-bold text-foreground mt-0.5">{activeReport.communicationScore}%</p>
                </div>
                <div className="bg-accent/5 p-2 rounded-xl">
                  <p className="text-[9px] text-muted uppercase font-bold">Problems</p>
                  <p className="font-bold text-foreground mt-0.5">{activeReport.problemSolvingScore}%</p>
                </div>
                <div className="bg-accent/5 p-2 rounded-xl">
                  <p className="text-[9px] text-muted uppercase font-bold">Confidence</p>
                  <p className="font-bold text-foreground mt-0.5">{activeReport.confidenceScore}%</p>
                </div>
              </div>

              {/* Feedback list summary */}
              <div className="space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-primary uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Expert Review Summary</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed bg-accent/10 p-3.5 border border-border rounded-xl">
                  {activeReport.feedbackSummary}
                </p>
              </div>

              {activeReport.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Next Improvement Steps</p>
                  <ul className="space-y-1.5 text-xs text-foreground/80 leading-relaxed list-disc list-inside">
                    {activeReport.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
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
    </div>
  );
}
