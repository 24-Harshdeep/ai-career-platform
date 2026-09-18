"use client";

import React from "react";

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
      prompt: `How can I fix the missing ATS keywords in my resume to raise my target role position score?`,
    },
    {
      text: "Prepare Mock Interview",
      prompt: `How can I prepare for technical mock interview questions for a ${targetRole} position?`,
    },
    {
      text: "Optimize Portfolio README",
      prompt: `What specific documentation improvements should I make to my GitHub repository README files for a ${targetRole} role?`,
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center px-1">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
          Suggested Actions
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        {suggestions.map((s) => {
          return (
            <button
              key={s.text}
              onClick={() => onSelect(s.prompt)}
              className="flex items-center justify-center p-3 rounded-xl border border-border bg-card hover:bg-accent/40 hover:border-primary/40 text-center text-xs font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm flex-1"
            >
              <span className="truncate">{s.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PromptSuggestions;
