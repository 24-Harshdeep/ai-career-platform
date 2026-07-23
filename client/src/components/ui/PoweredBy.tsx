"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Brain, Cpu, User, Globe, HelpCircle } from "lucide-react";

export type EngineType = "ai" | "engine" | "user" | "api";

export interface EngineDetail {
  type: EngineType;
  label: string;
  description: string;
  points?: string[];
}

export interface PoweredByProps {
  engines: EngineDetail[];
  className?: string;
}

export const PoweredBy: React.FC<PoweredByProps> = ({ engines, className }) => {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  const getEngineConfig = (type: EngineType) => {
    switch (type) {
      case "ai":
        return {
          icon: <Brain className="w-3.5 h-3.5 mr-1" />,
          title: "🧠 AI Engine",
          badgeStyle: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/15",
          dotStyle: "bg-purple-500",
        };
      case "engine":
        return {
          icon: <Cpu className="w-3.5 h-3.5 mr-1" />,
          title: "⚙️ Intelligence Engine",
          badgeStyle: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/15",
          dotStyle: "bg-blue-500",
        };
      case "user":
        return {
          icon: <User className="w-3.5 h-3.5 mr-1" />,
          title: "👤 User",
          badgeStyle: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15",
          dotStyle: "bg-amber-500",
        };
      case "api":
        return {
          icon: <Globe className="w-3.5 h-3.5 mr-1" />,
          title: "🌐 External APIs",
          badgeStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15",
          dotStyle: "bg-emerald-500",
        };
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-[10px] uppercase font-bold text-muted tracking-wider flex items-center mr-1">
        Powered By
      </span>

      {engines.map((engine, idx) => {
        const config = getEngineConfig(engine.type);
        const isActive = activeTooltip === idx;

        return (
          <div
            key={idx}
            className="relative"
            onMouseEnter={() => setActiveTooltip(idx)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <button
              type="button"
              className={cn(
                "inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all duration-200 cursor-help shadow-sm",
                config.badgeStyle
              )}
            >
              {config.icon}
              <span>{engine.label}</span>
            </button>

            {/* Hover Tooltip Card */}
            <div
              className={cn(
                "absolute z-[99] right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-64 p-4 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-lg transition-all duration-300 pointer-events-none origin-top scale-95 opacity-0",
                isActive && "scale-100 opacity-100 pointer-events-auto"
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className={cn("w-2 h-2 rounded-full", config.dotStyle)} />
                <span className="text-xs font-bold text-foreground">{config.title}</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed mb-2 font-medium">
                {engine.description}
              </p>
              {engine.points && engine.points.length > 0 && (
                <ul className="space-y-1 border-t border-border/50 pt-2">
                  {engine.points.map((pt, pIdx) => (
                    <li key={pIdx} className="text-[10px] text-foreground/80 flex items-start">
                      <span className="mr-1 text-primary">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              )}
              {/* Arrow pointing up */}
              <div className="absolute bottom-full right-6 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 -mb-1 w-2.5 h-2.5 bg-card border-l border-t border-border rotate-45" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PoweredBy;
