"use client";

import React, { useEffect } from "react";
import { useCareerStore } from "@/store/careerStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const profile = useCareerStore((state) => state.profile);
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    // 1. Theme Mode
    const savedTheme = profile?.themeMode || localStorage.getItem("careeros_theme") || "Dark";
    const root = document.documentElement;
    if (savedTheme === "Dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }

    // 2. Accent Color
    const savedColor = profile?.accentColor || localStorage.getItem("careeros_accent") || "Purple";
    const colors: Record<string, { primary: string; secondary: string }> = {
      Purple: { primary: "#6366F1", secondary: "#8B5CF6" },
      Blue: { primary: "#2563EB", secondary: "#3B82F6" },
      Emerald: { primary: "#059669", secondary: "#10B981" },
      Indigo: { primary: "#4F46E5", secondary: "#6366F1" },
      Amber: { primary: "#D97706", secondary: "#F59E0B" },
      Rose: { primary: "#E11D48", secondary: "#F43F5E" }
    };

    const choice = colors[savedColor] || colors.Purple;
    root.style.setProperty("--primary", choice.primary);
    root.style.setProperty("--secondary", choice.secondary);
  }, [profile?.themeMode, profile?.accentColor]);

  return <>{children}</>;
}
