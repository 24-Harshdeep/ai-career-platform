"use client";

import React from "react";
import Card from "@/components/ui/Card/Card";
import { Flame } from "lucide-react";
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
    <Card className="h-full flex flex-col justify-between p-6">
      <div className="space-y-4">
        {/* Streak Info */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-warning/10 border border-warning/20 text-warning rounded-lg shrink-0">
            <Flame className="w-5 h-5 fill-warning" />
          </div>
          <div>
              <span className="text-lg font-bold text-foreground">{streak} Day{streak !== 1 ? "s" : ""}</span>
            <p className="text-xs text-muted font-medium">Learning Streak</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted leading-relaxed">
            {streak >= 3
              ? "Great consistency! Keep completing daily activities to maintain your streak."
              : "Complete roadmap lessons or practice interviews daily to build your streak."}
          </p>
        </div>

        {/* Day bubbles */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          {days.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center space-y-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors duration-200 ${
                  activeDays[idx]
                    ? "bg-warning/15 text-warning border-warning/30"
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
