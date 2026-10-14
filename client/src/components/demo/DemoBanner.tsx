"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight, Lock } from "lucide-react";

/**
 * DemoBanner
 *
 * Shown when the current session is authenticated as the public demo account
 * (alex@careeros.dev). Displays a persistent top-of-page ribbon with:
 *  - Demo mode indicator
 *  - Explanation that data is read-only
 *  - Sign-up CTA
 *
 * The banner can be dismissed per-session (localStorage flag).
 * It reappears on a fresh session so returning visitors are never confused.
 */

const DEMO_EMAIL = "alex@careeros.dev";
const DISMISSED_KEY = "careeros_demo_banner_dismissed";

interface DemoBannerProps {
  userEmail?: string | null;
}

export function DemoBanner({ userEmail }: DemoBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userEmail || userEmail.toLowerCase() !== DEMO_EMAIL) return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, [userEmail]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="Demo mode notification"
      className="relative w-full z-50 bg-gradient-to-r from-violet-600/95 via-purple-600/95 to-indigo-600/95 backdrop-blur-sm border-b border-violet-400/30 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: indicator + message */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              Demo Mode
            </span>
          </div>

          <span className="text-white/20 hidden sm:block">|</span>

          <div className="flex items-center gap-1.5 min-w-0">
            <Lock className="w-3.5 h-3.5 text-violet-200 shrink-0" />
            <p className="text-xs text-violet-100 truncate">
              You&apos;re exploring a read-only demo.{" "}
              <span className="hidden md:inline">
                Career data shown is sample data for Alex Chen — no real
                accounts are affected.
              </span>
            </p>
          </div>
        </div>

        {/* Right: CTA + dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-violet-700 text-xs font-bold hover:bg-violet-50 transition-colors shadow-sm"
          >
            <span>Sign up free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={dismiss}
            aria-label="Dismiss demo banner"
            className="p-1.5 rounded-md text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
