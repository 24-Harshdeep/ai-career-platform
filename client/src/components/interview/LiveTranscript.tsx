"use client";

import React, { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

export interface ConversationMessage {
  role: "ai" | "user" | "system";
  text: string;
  timestamp?: string | Date;
}

interface LiveTranscriptProps {
  conversation: ConversationMessage[];
  interimTranscript?: string;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  conversation,
  interimTranscript
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [conversation, interimTranscript]);

  return (
    <div
      ref={containerRef}
      className="space-y-4 max-h-[380px] overflow-y-auto p-4 rounded-2xl bg-accent/5 border border-border scrollbar-thin"
    >
      {conversation.length === 0 && !interimTranscript && (
        <div className="text-center py-8 text-xs text-muted italic">
          Conversation transcript will appear here in real-time as you and the AI speak.
        </div>
      )}

      {conversation.map((msg, idx) => (
        <div
          key={idx}
          className={`flex items-start gap-3 text-xs ${
            msg.role === "user" ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* Avatar Icon */}
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm ${
              msg.role === "user"
                ? "bg-emerald-500"
                : msg.role === "ai"
                ? "bg-primary"
                : "bg-muted"
            }`}
          >
            {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>

          {/* Speech Bubble */}
          <div
            className={`max-w-[80%] p-3.5 rounded-2xl space-y-1 ${
              msg.role === "user"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-foreground"
                : "bg-card border border-border text-foreground"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-muted uppercase">
              <span>{msg.role === "user" ? "Candidate (You)" : "AI Interviewer"}</span>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
          </div>
        </div>
      ))}

      {/* Live Interim Transcript Bubble */}
      {interimTranscript && (
        <div className="flex items-start gap-3 text-xs flex-row-reverse">
          <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 animate-pulse">
            <User className="w-4 h-4" />
          </div>
          <div className="max-w-[80%] p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-foreground italic space-y-1">
            <span className="text-[9px] font-bold text-emerald-400 uppercase block">Live Speech Recording...</span>
            <p className="leading-relaxed">{interimTranscript}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTranscript;
