"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** A single shimmer line. Use w-* and h-* to control size. */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return <div className={cn("skeleton", className)} />;
};

/** Pre-composed skeleton for a card with header + 3 lines */
export const SkeletonCard: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-6 space-y-4", className)}>
      <Skeleton className="h-4 w-1/3" />
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
};

/** Pre-composed skeleton for a metric widget */
export const SkeletonMetric: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-5 flex items-center gap-4", className)}>
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
};

/** Pre-composed skeleton for a chart area */
export const SkeletonChart: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-6", className)}>
      <Skeleton className="h-4 w-1/4 mb-4" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
};

export default Skeleton;
