"use client";

import React from "react";
import { Mic, Volume2 } from "lucide-react";

interface AudioVisualizerProps {
  state: "AI_SPEAKING" | "USER_SPEAKING" | "USER_LISTENING" | "PROCESSING" | "AI_THINKING" | "IDLE" | "ERROR" | "FOLLOW_UP" | "NEXT_QUESTION" | "COMPLETED" | string;
  label?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ state, label }) => {
  const isAiSpeaking = state === "AI_SPEAKING";
  const isUserSpeaking = state === "USER_SPEAKING";
  const isProcessing = state === "PROCESSING" || state === "AI_THINKING";

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      {/* Wave Ring Animation */}
      <div className="relative flex items-center justify-center">
        {isAiSpeaking && (
          <>
            <span className="absolute w-24 h-24 rounded-full bg-primary/20 animate-ping" />
            <span className="absolute w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
          </>
        )}

        {isUserSpeaking && (
          <>
            <span className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping" />
            <span className="absolute w-20 h-20 rounded-full bg-emerald-500/30 animate-pulse" />
          </>
        )}

        {isProcessing && (
          <span className="absolute w-24 h-24 rounded-full bg-amber-500/20 animate-spin border-2 border-dashed border-amber-500/60" />
        )}

        {/* Central Orb Icon */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            isAiSpeaking
              ? "bg-primary text-white shadow-primary/40 scale-110"
              : isUserSpeaking
              ? "bg-emerald-500 text-white shadow-emerald-500/40 scale-110"
              : isProcessing
              ? "bg-amber-500 text-white shadow-amber-500/40"
              : "bg-accent/20 border border-border text-muted"
          }`}
        >
          {isAiSpeaking ? (
            <Volume2 className="w-8 h-8 animate-bounce" />
          ) : isUserSpeaking ? (
            <Mic className="w-8 h-8 animate-pulse" />
          ) : (
            <Mic className="w-7 h-7 opacity-70" />
          )}
        </div>
      </div>

      {/* State Text Label */}
      <div className="text-center space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          {label ||
            (isAiSpeaking
              ? "AI Interviewer Speaking..."
              : isUserSpeaking
              ? "Listening to Candidate..."
              : isProcessing
              ? "Evaluating Response..."
              : "Mic Ready / Awaiting Response")}
        </p>
        <p className="text-[10px] text-muted">
          {isAiSpeaking
            ? "Listen carefully to the question prompt."
            : isUserSpeaking
            ? "Speak clearly into your microphone."
            : isProcessing
            ? "AI coach is scoring technical depth & clarity."
            : "Click 'Start Speaking' or type your response below."}
        </p>
      </div>
    </div>
  );
};

export default AudioVisualizer;
