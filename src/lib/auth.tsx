"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface SessionUser {
  name: string;
  email: string;
  image?: string;
  role: string;
}

export interface Session {
  user: SessionUser;
  status: "authenticated" | "unauthenticated" | "loading";
}

interface AuthContextType {
  session: Session;
  signIn: (email?: string, password?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  switchUser: (role: string, name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session>({
    user: {
      name: "Harshdeep",
      email: "harshdeep@careeros.dev",
      image: "",
      role: "Full Stack Developer",
    },
    status: "authenticated",
  });

  const signIn = async (email?: string, password?: string): Promise<boolean> => {
    setSession((prev) => ({ ...prev, status: "loading" }));
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSession({
      user: {
        name: email ? email.split("@")[0] : "Harshdeep",
        email: email || "harshdeep@careeros.dev",
        role: "Full Stack Developer",
      },
      status: "authenticated",
    });
    return true;
  };

  const signOut = async () => {
    setSession((prev) => ({ ...prev, status: "loading" }));
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSession({
      user: { name: "", email: "", role: "" },
      status: "unauthenticated",
    });
  };

  const switchUser = (role: string, name: string) => {
    setSession({
      user: {
        name,
        email: `${name.toLowerCase()}@careeros.dev`,
        role,
      },
      status: "authenticated",
    });
  };

  return (
    <AuthContext.Provider value={{ session, signIn, signOut, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
