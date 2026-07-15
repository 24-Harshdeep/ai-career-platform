"use client";

import React, { useState } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { GraduationCap, Sparkles, CheckSquare, Square, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function InterviewPrepPage() {
  const addNotification = useCareerStore((state) => state.addNotification);
  const updateScore = useCareerStore((state) => state.updateScore);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [completedList, setCompletedList] = useState<boolean[]>([true, false, false]);

  const questions = [
    {
      q: "Explain database indexing and how it optimizes PostgreSQL query execution.",
      a: "Indexes speed up read queries by creating structured search paths (like B-Trees) so the database doesn't scan the entire table. However, indexes slow down write actions (INSERT/UPDATE) since the indexes must be recalculated. Optimize queries using EXPLAIN ANALYZE to check index hit ratios.",
      points: 2,
    },
    {
      q: "Describe the lifecycle and security mechanisms of JWT authentication and rotation.",
      a: "JSON Web Tokens contain a header, payload, and signature. Access tokens are short-lived (e.g., 15 mins) and stored in-memory, while refresh tokens are long-lived, stored in httpOnly cookies, and used to request new access tokens. If a token is compromised, refresh token rotation (RTR) detects reuse and invalidates the session family.",
      points: 3,
    },
    {
      q: "What is React Hydration and why do hydration mismatches occur in Next.js App Router?",
      a: "Hydration is the process of mapping client-side React code onto pre-rendered server-side HTML. Mismatches occur when the HTML generated on the server doesn't match the client's rendered markup. This is caused by client-side browser specific APIs (like localStorage, window, or random numbers) running during server rendering. Solve this with useEffect hooks or next/dynamic lazy loading.",
      points: 2,
    },
  ];

  const handleToggleComplete = (index: number, points: number, qText: string) => {
    const updated = [...completedList];
    const nextStatus = !updated[index];
    updated[index] = nextStatus;
    setCompletedList(updated);

    if (nextStatus) {
      updateScore(points);
      addNotification(`Mastered question: "${qText.slice(0, 30)}..."! +${points} Career Score.`, "success");
    } else {
      updateScore(-points);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Interview Prep Dashboard</h2>
          <p className="text-xs text-muted">Core questions deck, security checks, and mock interview setups synced with your target goal.</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Simulator card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
              AI Mock Interview Prep
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Launch a live chat mock interview session with your Career Coach. The coach will ask role-specific questions and score your answers.
            </p>
            <div className="bg-accent/15 border border-border p-3.5 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Target level</span>
                <span className="text-foreground font-bold">Intermediate</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Mastery Index</span>
                <span className="text-foreground font-bold">42% completed</span>
              </div>
            </div>
            <Link href="/coach" className="block">
              <Button variant="ai" className="w-full text-xs font-semibold">
                Start Mock Interview
              </Button>
            </Link>
          </Card>

          <Card variant="insight" className="p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-xs text-primary font-bold uppercase tracking-wider">Interview Pro-tip</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed font-medium">
              Stripe interviews heavily test security token lifecycle logic. Master the JWT questions list in the right panel before your next call.
            </p>
          </Card>
        </div>

        {/* Right Column: Common Questions deck */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-sm font-semibold text-foreground">Common Interview Questions Deck</h3>
              <Badge variant="warning">Intermediate Full Stack</Badge>
            </div>

            <div className="space-y-4">
              {questions.map((item, index) => (
                <div
                  key={index}
                  className="border border-border bg-accent/5 hover:bg-accent/10 rounded-2xl p-4 space-y-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      onClick={() => handleToggleComplete(index, item.points, item.q)}
                      className="mt-0.5 shrink-0 text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                      {completedList[index] ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold text-foreground leading-relaxed ${
                          completedList[index] ? "text-muted" : ""
                        }`}
                      >
                        {item.q}
                      </p>
                      <span className="text-[10px] text-primary font-semibold mt-1 block">
                        Reward: +{item.points} Score
                      </span>
                    </div>
                    <button
                      onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                      className="text-muted hover:text-foreground shrink-0 cursor-pointer"
                    >
                      {expandedIndex === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded Answer */}
                  {expandedIndex === index && (
                    <div className="border-t border-border pt-3 mt-2 text-xs leading-relaxed text-foreground/80 bg-card/60 rounded-xl p-3.5 border border-border/40">
                      <span className="text-[9px] text-primary font-bold uppercase tracking-wider block mb-1">
                        Coach Answer Guide
                      </span>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
