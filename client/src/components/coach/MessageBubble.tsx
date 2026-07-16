"use client";

import React from "react";
import { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { Brain, User } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isCoach = message.sender === "coach";

  // Helper to parse basic markdown elements to React
  const parseMarkdownToReact = (text: string) => {
    if (!text) return "";
    const lines = text.split("\n");

    return lines.map((line, idx) => {
      // 1. Headers: ### Title or #### Title
      const headerMatch = line.match(/^(#{3,4})\s+(.*)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const content = headerMatch[2];
        const parsed = parseInlineStyles(content);
        if (level === 3) {
          return (
            <h3 key={idx} className="text-sm font-bold text-foreground mt-4 mb-2 first:mt-0">
              {parsed}
            </h3>
          );
        }
        return (
          <h4 key={idx} className="text-xs font-semibold text-foreground mt-3 mb-1 first:mt-0">
            {parsed}
          </h4>
        );
      }

      // 2. Bullet Lists: * Item or - Item
      const bulletMatch = line.match(/^(\*|-)\s+(.*)$/);
      if (bulletMatch) {
        const content = bulletMatch[2];
        const parsed = parseInlineStyles(content);
        return (
          <div key={idx} className="flex items-start space-x-2 my-1 pl-2">
            <span className="text-primary font-bold select-none shrink-0">•</span>
            <span className="text-sm text-foreground/90">{parsed}</span>
          </div>
        );
      }

      // 3. Blockquotes (Warnings/Info tags)
      if (line.startsWith("> ")) {
        const content = line.slice(2);
        const parsed = parseInlineStyles(content);
        return (
          <blockquote key={idx} className="border-l-3 border-amber-500/80 bg-amber-500/5 px-4 py-2.5 my-2.5 rounded-r-xl text-xs italic text-amber-600/90 font-medium">
            {parsed}
          </blockquote>
        );
      }

      // 4. Default Paragraph
      const parsed = parseInlineStyles(line);
      return (
        <p key={idx} className="text-sm text-foreground/90 my-1 min-h-[1rem]">
          {parsed}
        </p>
      );
    });
  };

  // Helper to parse inline bolding (**text**) and code (`code`)
  const parseInlineStyles = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={partIdx} className="font-extrabold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={partIdx} className="bg-accent/40 px-1.5 py-0.5 rounded text-[11px] font-mono border border-border text-primary font-semibold">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={cn(
        "flex w-full items-start space-x-3 py-3",
        isCoach ? "justify-start" : "justify-end space-x-reverse"
      )}
    >
      {/* Avatar Icon */}
      <div
        className={cn(
          "w-8.5 h-8.5 rounded-lg flex items-center justify-center shrink-0 border shadow-sm text-xs font-bold",
          isCoach
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-secondary/15 text-secondary border-secondary/20"
        )}
      >
        {isCoach ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Bubble text */}
      <div className="flex flex-col max-w-[70%] space-y-1">
        <div className="flex items-center space-x-2 text-[10px] font-semibold text-muted px-1 justify-between">
          <span>{isCoach ? "AI Coach" : "You"}</span>
          <span>{message.timestamp}</span>
        </div>

        <div
          className={cn(
            "p-4 rounded-2xl text-sm leading-relaxed border shadow-sm",
            isCoach
              ? "bg-card text-foreground border-border rounded-tl-sm space-y-1"
              : "bg-primary text-white border-primary/20 rounded-tr-sm"
          )}
        >
          {isCoach ? parseMarkdownToReact(message.text) : message.text}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
