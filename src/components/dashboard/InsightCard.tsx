"use client";

import React from "react";
import Card from "@/components/ui/Card/Card";
import Badge from "@/components/ui/Badge/Badge";
import { Lightbulb, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const InsightCard: React.FC = () => {
  return (
    <Card variant="insight" className="h-full flex flex-col justify-between p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-2 border-b border-border pb-3">
          <Lightbulb className="w-5 h-5 text-warning" />
          <h3 className="text-xs text-warning font-bold uppercase tracking-wider">
            Critical Career Insight
          </h3>
        </div>

        {/* Focus Area */}
        <div className="space-y-1">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
            Biggest Opportunity
          </span>
          <h4 className="text-lg font-bold text-foreground">System Design</h4>
        </div>

        {/* Reason Description */}
        <div className="bg-accent/15 border border-border rounded-xl p-3.5 space-y-1">
          <span className="text-[9px] text-muted font-bold uppercase">Coach Explanation</span>
          <p className="text-xs text-foreground/80 leading-relaxed font-medium">
            "You have solved 42 coding problems recently, demonstrating strong execution. However, your
            github portfolio lacks distributed architecture patterns. Master system scaling next."
          </p>
        </div>
      </div>

      {/* Footer shortcut */}
      <div className="mt-6 border-t border-border pt-4">
        <Link
          href="/coach"
          className="text-xs text-primary font-semibold hover:underline flex items-center space-x-1"
        >
          <span>Ask Coach about System Design</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};

export default InsightCard;
