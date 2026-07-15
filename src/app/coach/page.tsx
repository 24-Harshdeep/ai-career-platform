"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCareerStore } from "@/store/careerStore";
import MessageBubble from "@/components/coach/MessageBubble";
import PromptSuggestions from "@/components/coach/PromptSuggestions";
import { aiService } from "@/services/ai.service";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import { Send, Brain, Sparkles } from "lucide-react";

export default function CoachPage() {
  const chatHistory = useCareerStore((state) => state.chatHistory);
  const addChatMessage = useCareerStore((state) => state.addChatMessage);

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

    // Send user message
    addChatMessage("user", textToSend);
    setInput("");
    setIsTyping(true);

    try {
      // Get AI Coach reply
      const reply = await aiService.generateCoachResponse(textToSend);
      addChatMessage("coach", reply);
    } catch (err) {
      console.error(err);
      addChatMessage("coach", "Sorry, I had trouble parsing that. Could you try again?");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-fade-in-up">
      {/* Top Title Bar */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Career Coach</h2>
          <p className="text-xs text-muted">Intelligent guidance on resumes, roadmaps, and mock interviews.</p>
        </div>
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
              placeholder="Ask anything about your resume, roadmap, or job search..."
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
