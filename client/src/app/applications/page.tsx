"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";

export default function ApplicationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/resume?step=4");
  }, [router]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center space-y-4">
      <Briefcase className="w-10 h-10 text-primary animate-pulse" />
      <span className="text-xs text-muted">Redirecting to Resume Target Job Match (Step 4)...</span>
    </div>
  );
}
