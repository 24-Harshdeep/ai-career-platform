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
            "p-3.5 rounded-2xl text-sm leading-relaxed border shadow-sm whitespace-pre-line",
            isCoach
              ? "bg-card text-foreground border-border rounded-tl-sm"
              : "bg-primary text-white border-primary/20 rounded-tr-sm"
          )}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
