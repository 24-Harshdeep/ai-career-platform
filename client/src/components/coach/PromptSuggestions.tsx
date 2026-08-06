"use client";

import React from "react";
import { Sparkles, FileText, Code2, Map, CheckSquare, MessageSquare } from "lucide-react";

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
  userName?: string;
  targetRole?: string;
  atsScore?: number;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelect,
  userName = "Candidate",
  targetRole = "Full Stack Developer",
  atsScore = 82
}) => {
  const suggestions = [
    {
      text: "Fix ATS Keywords",
      icon: FileText,
      prompt: `How can I fix the missing ATS keywords in my resume to raise my score of ${atsScore}% for a ${targetRole} position?`,
    },
    {
      text: "Prepare Mock Interview",
      icon: MessageSquare,
      prompt: `Let's start a mock technical interview focusing on database query tuning and systems design challenges for a ${targetRole} role.`,
    },
    {
      text: "Optimize Project README",
      icon: Code2,
      prompt: `I want to audit my portfolio repositories. What specific changes should I make to my GitHub README documentation to impress FAANG engineering recruiters?`,
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center space-x-1.5 px-1">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
          Suggested Actions
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        {suggestions.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.text}
              onClick={() => onSelect(s.prompt)}
              className="flex items-center justify-start space-x-2.5 p-3 rounded-xl border border-border bg-card hover:bg-accent/40 hover:border-primary/40 text-left text-xs font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm flex-1"
            >
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{s.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PromptSuggestions;
