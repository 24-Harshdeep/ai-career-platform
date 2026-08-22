"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "success" | "warning" | "danger" | "muted";
  showLabel?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2.5",
};

const colorMap = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  muted: "bg-muted",
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = "md",
  color = "primary",
  showLabel = false,
  className,
}) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium mb-1">
          <span className="text-muted">Progress</span>
          <span className="text-foreground">{Math.round(percent)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-accent/40 rounded-full overflow-hidden", sizeMap[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorMap[color]
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
