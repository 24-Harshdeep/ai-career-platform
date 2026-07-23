"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import MessageBubble from "@/components/coach/MessageBubble";
import PromptSuggestions from "@/components/coach/PromptSuggestions";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import { Send, Brain } from "lucide-react";
import PoweredBy from "@/components/ui/PoweredBy";

function CoachChatContent() {
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from") || "/dashboard";

  const chatHistory = useCareerStore((state) => state.chatHistory);
  const sendCoachMessage = useCareerStore((state) => state.sendCoachMessage);

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

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-fade-in-up">
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{coachTitle}</h2>
            <p className="text-xs text-muted">{coachDesc}</p>
          </div>
        </div>
        <PoweredBy engines={[
          {
            type: "ai",
            label: "Multi-Agent LLM",
            description: "A cooperative network of specialized agents backing the user.",
            points: ["Resume Coach", "Interview Coach", "Learning Coach", "Project Coach", "Career Advisor"]
          },
          {
            type: "engine",
            label: "Profile Context",
            description: "Pipes real-time database state to feed agent memory.",
            points: ["Injects Career DNA state", "Pipes Resume & Project audits", "Loads Interview history"]
          }
        ]} />
      </div>

      {/* Main Chat Panel */}
      <Card className="flex-1 flex flex-col p-0 overflow-hidden min-h-0 bg-card border-border shadow-sm">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {chatHistory.map((msg) => (
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

        {/* Suggested Prompts Panel */}
        <div className="px-6 py-4 border-t border-border bg-accent/10">
          <PromptSuggestions onSelect={handleSendMessage} />
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
