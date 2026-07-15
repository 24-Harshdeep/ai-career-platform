"use client";

import { useSession } from "@/lib/auth";

export const useAuth = () => {
  const { session, signIn, signOut, switchUser } = useSession();

  return {
    user: session.user,
    status: session.status,
    isAuthenticated: session.status === "authenticated",
    isLoading: session.status === "loading",
    signIn,
    signOut,
    switchUser,
  };
};
