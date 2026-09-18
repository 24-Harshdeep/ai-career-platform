"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import MessageBubble from "@/components/coach/MessageBubble";
import PromptSuggestions from "@/components/coach/PromptSuggestions";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import { Send, Brain, Plus } from "lucide-react";
import { clsx } from "clsx";
import PoweredBy from "@/components/ui/PoweredBy";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";

function CoachChatContent() {
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from") || "/dashboard";

  const chatHistory = useCareerStore((state) => state.chatHistory);
  const activeSessionId = useCareerStore((state) => state.activeSessionId);
  const chatSessions = useCareerStore((state) => state.chatSessions);
  const sendCoachMessage = useCareerStore((state) => state.sendCoachMessage);
  const fetchCoachSessions = useCareerStore((state) => state.fetchCoachSessions);
  const fetchCoachHistory = useCareerStore((state) => state.fetchCoachHistory);
  const startNewChatSession = useCareerStore((state) => state.startNewChatSession);

  useEffect(() => {
    fetchCoachSessions();
    fetchCoachHistory();
  }, [fetchCoachSessions, fetchCoachHistory]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setInput("");
    setIsTyping(true);

    try {
      // Fire action hitting Express backend AI Router
      await sendCoachMessage(textToSend, fromPath);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  // Determine header and coach role details dynamically
  let coachTitle = "AI Career Coach";
  let coachDesc = "Intelligent guidance on career trajectories, skill growths, and score increases.";
  let placeholder = "Ask anything about your career path or roadmap...";

  if (fromPath.includes("/resume")) {
    coachTitle = "AI Resume Coach";
    coachDesc = "ATS optimization, missing keyword match reviews, and bullet point optimizations.";
    placeholder = "Paste a resume bullet or ask how to optimize for target ATS keywords...";
  } else if (fromPath.includes("/roadmap")) {
    coachTitle = "AI Learning Coach";
    coachDesc = "Explanations of roadmap tracks, coding challenges, and database designs.";
    placeholder = "Ask to explain a sub-skill or write a code example...";
  } else if (fromPath.includes("/interview")) {
    coachTitle = "AI Interview Coach";
    coachDesc = "Technical mock coding practice and HR behavioral response checks.";
    placeholder = "Start a mock interview query or ask behavioral review tips...";
  } else if (fromPath.includes("/portfolio") || fromPath.includes("/project")) {
    coachTitle = "AI Project Coach";
    coachDesc = "Code quality audits, Docker setups, and README documentation reviews.";
    placeholder = "Ask how to containerize your server or write test coverages...";
  }

  const storeUser = useCareerStore((state) => state.user);
  const profile = useCareerStore((state) => state.profile);

  const userName = storeUser?.name || "there";
  const userScore = storeUser?.score;
  const userRole = profile?.targetRole || "your target role";

  const defaultGreetingText = userScore
    ? `Good morning ${userName}. Your current career score is ${userScore}%. Based on your goal of becoming a ${userRole}, I can help you choose the highest-impact next step.`
    : `Good morning ${userName}. I can help you choose the highest-impact next step for your career goal once your profile and artifacts are loaded.`;

  const defaultGreeting = {
    id: "default-greeting",
    sender: "coach" as const,
    text: defaultGreetingText,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  const renderedMessages = chatHistory && chatHistory.length > 0 ? chatHistory : [defaultGreeting];

  return (
    <PageTransition className="h-[calc(100vh-140px)] flex flex-col space-y-6 pb-12">
      <StaggerItem>
        <PageHeader
          icon={Brain}
          title={coachTitle}
          description={coachDesc}
        />
      </StaggerItem>

      {/* Main Split Layout Panel */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Left Side Panel - Context & History (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col w-[260px] space-y-4 shrink-0 overflow-y-auto custom-scrollbar">
          
          {/* AI Active Context Card */}
          <Card className="p-4 bg-card border-border/80 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-border pb-2.5">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">AI Active Context</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted hover:text-foreground transition-colors">
                <span className="font-medium">Candidate Profile</span>
                <span className="text-[10px] bg-green-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Linked
                </span>
              </div>
              <div className="flex items-center justify-between text-muted hover:text-foreground transition-colors">
                <span className="font-medium">Target Career DNA</span>
                <span className="text-[10px] bg-green-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                </span>
              </div>
              <div className="flex items-center justify-between text-muted hover:text-foreground transition-colors">
                <span className="font-medium">Resume & ATS Gaps</span>
                <span className="text-[10px] bg-green-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Fed
                </span>
              </div>
              <div className="flex items-center justify-between text-muted hover:text-foreground transition-colors">
                <span className="font-medium">GitHub Repo Scans</span>
                <span className="text-[10px] bg-green-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between text-muted hover:text-foreground transition-colors">
                <span className="font-medium">Learning Roadmap</span>
                <span className="text-[10px] bg-green-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Synced
                </span>
              </div>
              <div className="flex items-center justify-between text-muted hover:text-foreground transition-colors">
                <span className="font-medium">Interview History</span>
                <span className="text-[10px] bg-green-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Fed
                </span>
              </div>
              <div className="flex items-center justify-between text-muted hover:text-foreground transition-colors">
                <span className="font-medium">Career Analytics</span>
                <span className="text-[10px] bg-green-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Tracked
                </span>
              </div>
            </div>
          </Card>

          {/* Past Conversations Card */}
          <Card className="p-4 bg-card border-border/80 shadow-sm flex-1 flex flex-col space-y-3 min-h-0">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">Conversation History</span>
              <button
                type="button"
                onClick={() => startNewChatSession()}
                className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
                title="Start a new chat thread"
              >
                <Plus className="w-3 h-3" />
                <span>New Chat</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 text-xs pr-1">
              {chatSessions && chatSessions.length > 0 ? (
                chatSessions.map((session) => {
                  const isActive = session.sessionId === activeSessionId;
                  return (
                    <div
                      key={session.sessionId}
                      onClick={() => fetchCoachHistory(session.sessionId)}
                      className={clsx(
                        "p-2.5 rounded-lg cursor-pointer transition-all border text-xs flex flex-col space-y-1",
                        isActive
                          ? "bg-primary/15 border-primary/40 text-foreground font-medium shadow-sm"
                          : "bg-accent/10 border-border/40 text-muted-foreground hover:bg-accent/20 hover:border-primary/20 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-semibold text-foreground truncate">{session.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{session.formattedDate}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {session.messageCount} {session.messageCount === 1 ? "prompt" : "prompts"}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-[11px] text-muted-foreground py-6 text-center">
                  No past chats yet. Click "+ New Chat" to start.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Main Chat Card */}
        <Card className="flex-1 flex flex-col p-0 overflow-hidden min-h-0 bg-card border-border shadow-sm">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {renderedMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex w-full items-start space-x-3 py-3 justify-start">
                <div className="w-8.5 h-8.5 rounded-lg flex items-center justify-center shrink-0 border border-primary/20 bg-primary/10 text-primary shadow-sm">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="text-[10px] font-semibold text-muted px-1">AI Coach</div>
                  <div className="p-3.5 rounded-2xl text-sm bg-card text-foreground border border-border rounded-tl-sm shadow-sm flex items-center space-x-1.5 min-w-[70px]">
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Commands Chips */}
          <div className="px-6 py-2.5 bg-card border-t border-border flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
            <span className="text-[9px] font-bold text-muted uppercase tracking-wider shrink-0 mr-1">Quick Tools:</span>
            {[
              "Next Best Step",
              "Explain My Score",
              "Review My Resume",
              "Find Missing Skills",
              "Generate Weekly Plan",
              "Prepare Interview",
              "Analyze GitHub",
              "Optimize Portfolio"
            ].map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => handleSendMessage(`Help me with my ${cmd.toLowerCase()}`)}
                className="px-2.5 py-1 text-[10px] font-semibold rounded-full border border-border bg-accent/5 hover:bg-primary/15 hover:border-primary/30 text-foreground transition-all cursor-pointer shrink-0"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Suggested Prompts Panel */}
          <div className="px-6 py-4 border-t border-border bg-accent/10">
            <PromptSuggestions 
              onSelect={handleSendMessage} 
              userName={userName}
              targetRole={userRole}
              atsScore={userScore}
            />
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="flex items-center space-x-3 bg-accent/20 border border-border rounded-2xl px-4 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder-muted"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || !input.trim()}
                className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}

export default function CoachPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center space-y-4">
        <Brain className="w-10 h-10 text-primary animate-pulse" />
        <span className="text-xs text-muted">Loading AI Specialist Coach...</span>
      </div>
    }>
      <CoachChatContent />
    </Suspense>
  );
}
