"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dna?tab=analytics");
  }, [router]);

  return (
    <div className="h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted font-semibold">Redirecting to Career DNA & Analytics Hub...</span>
      </div>
    </div>
  );
}
