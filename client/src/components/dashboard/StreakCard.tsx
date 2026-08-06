"use client";

import React from "react";
import Card from "@/components/ui/Card/Card";
import { Flame, Sparkles } from "lucide-react";
import { useCareerStore } from "@/store/careerStore";

export const StreakCard: React.FC = () => {
  const streak = useCareerStore((state) => state.streakDays);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  // Calculate active days dynamically ending on today's weekday index
  // (new Date().getDay() + 6) % 7 maps: Monday -> 0, Tuesday -> 1, ..., Sunday -> 6
  const todayIdx = (new Date().getDay() + 6) % 7;

  const activeDays = days.map((_, idx) => {
    if (streak >= 7) return true;
    if (streak <= 0) return false;

    // Start index of the streak window
    const startIdx = todayIdx - streak + 1;
    if (startIdx >= 0) {
      return idx >= startIdx && idx <= todayIdx;
    } else {
      // Handles wrapping if start index falls in the previous week
      const wrappedStartIdx = startIdx + 7;
      return idx <= todayIdx || idx >= wrappedStartIdx;
    }
  });

  return (
    <Card className="h-full flex flex-col justify-between p-6 overflow-hidden relative">
      {/* Decorative subtle gradient background */}
      <div className="absolute right-0 bottom-0 w-24 h-24 bg-warning/5 rounded-full blur-xl pointer-events-none" />

      <div className="space-y-4">
        {/* Streak Info */}
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-xl shrink-0 animate-bounce">
            <Flame className="w-6 h-6 fill-warning" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-xl font-extrabold text-foreground">{streak} Day</span>
              {streak > 0 && <Sparkles className="w-3.5 h-3.5 text-warning" />}
            </div>
            <p className="text-xs text-muted font-medium">Learning Streak</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-foreground font-medium leading-relaxed">
            {streak >= 3
              ? "You're improving faster than 89% of developers in your cohort. Keep building momentum!"
              : "Complete roadmap lessons or mock interviews daily to build your streak and unlock score multipliers!"}
          </p>
        </div>

        {/* Day bubbles */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          {days.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center space-y-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors duration-200 ${
                  activeDays[idx]
                    ? "bg-warning/25 text-warning border-warning/35 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                    : "bg-accent/10 text-muted border-border"
                }`}
              >
                {activeDays[idx] ? <Flame className="w-3.5 h-3.5 fill-warning" /> : day}
              </div>
              <span className="text-[9px] text-muted font-semibold">{day}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default StreakCard;
