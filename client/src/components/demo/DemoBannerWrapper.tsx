"use client";

import { useSession } from "@/lib/auth";
import { DemoBanner } from "@/components/demo/DemoBanner";

/**
 * DemoBannerWrapper
 *
 * Client component wrapper that reads the current user email via useSession
 * and renders DemoBanner when the public demo account is active.
 */
export function DemoBannerWrapper() {
  const { session } = useSession();
  const email = session?.user?.email ?? null;
  return <DemoBanner userEmail={email} />;
}
