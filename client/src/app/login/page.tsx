"use client";

import React, { useEffect } from "react";
import { useSession } from "@/lib/auth";
import { LoginView } from "@/components/auth/LoginView";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { session, signIn, signUp, switchUser } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "authenticated") {
      router.push("/dashboard");
    }
  }, [session.status, router]);

  if (session.status === "authenticated") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F4F7FF]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-600 font-semibold">Opening Dashboard...</span>
        </div>
      </div>
    );
  }

  return <LoginView onSignIn={signIn} onSignUp={signUp} onQuickDemoLogin={switchUser} />;
}
