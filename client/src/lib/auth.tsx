"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import { KeyRound, Mail, User as UserIcon, ShieldAlert } from "lucide-react";

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
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"}/auth`;

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session>({
    user: { name: "", email: "", role: "" },
    status: "loading",
  });

  // Session Recovery on Initial Load
  useEffect(() => {
    const recoverSession = async () => {
      const token = localStorage.getItem("careeros_token");
      if (!token) {
        setSession({
          user: { name: "", email: "", role: "" },
          status: "unauthenticated",
        });
        return;
      }

      try {
        const res = await fetch(`${API_URL}/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setSession({
            user: {
              name: data.user.name,
              email: data.user.email,
              role: data.user.role || "Full Stack Developer",
            },
            status: "authenticated",
          });
        } else {
          // Token is expired/invalid
          localStorage.removeItem("careeros_token");
          setSession({
            user: { name: "", email: "", role: "" },
            status: "unauthenticated",
          });
        }
      } catch (err) {
        // Network offline/server unreachable, force login
        localStorage.removeItem("careeros_token");
        setSession({
          user: { name: "", email: "", role: "" },
          status: "unauthenticated",
        });
      }
    };

    recoverSession();
  }, []);

  const signIn = async (email?: string, password?: string): Promise<boolean> => {
    setSession((prev) => ({ ...prev, status: "loading" }));

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("careeros_token", data.token);
        setSession({
          user: {
            name: data.user.name,
            email: data.user.email,
            role: data.user.role || "Full Stack Developer",
          },
          status: "authenticated",
        });
        return true;
      }
    } catch (err) {
      console.error("Auth server connection error:", err);
    }

    setSession({
      user: { name: "", email: "", role: "" },
      status: "unauthenticated",
    });
    return false;
  };

  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    setSession((prev) => ({ ...prev, status: "loading" }));

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("careeros_token", data.token);
        setSession({
          user: {
            name: data.user.name,
            email: data.user.email,
            role: data.user.role || "Full Stack Developer",
          },
          status: "authenticated",
        });
        return true;
      }
    } catch (err) {
      console.error("Auth registration server connection error:", err);
    }

    setSession({
      user: { name: "", email: "", role: "" },
      status: "unauthenticated",
    });
    return false;
  };

  const signOut = async () => {
    setSession((prev) => ({ ...prev, status: "loading" }));
    localStorage.removeItem("careeros_token");
    await new Promise((resolve) => setTimeout(resolve, 150));
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
    <AuthContext.Provider value={{ session, signIn, signOut, switchUser, signUp }}>
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

// 🔐 Client AuthGuard Interface Form Component
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, signIn, signUp } = useSession();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (session.status === "loading") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted font-semibold">Verifying Secure Credentials...</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      let success = false;
      if (isSignUp) {
        success = await signUp(name, email, password);
      } else {
        success = await signIn(email, password);
      }

      if (!success) {
        setError(isSignUp ? "Registration failed. Email might already exist." : "Invalid email or password.");
      }
    } catch (err) {
      setError("Server connection failed. Verify your server is online.");
    } finally {
      setLoading(false);
    }
  };

  if (session.status === "unauthenticated") {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Abstract background graphics */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

        <Card className="w-full max-w-md p-8 bg-card/60 border-border/80 backdrop-blur-lg rounded-3xl shadow-2xl relative z-10 space-y-6">
          {/* Logo Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 overflow-hidden relative shrink-0 mb-2">
              <img 
                src="/logo1.png" 
                alt="CareerOS Logo" 
                className="absolute top-0 left-1/2 transform -translate-x-1/2 h-[86px] max-w-none"
              />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {isSignUp ? "Create your Account" : "Sign In to CareerOS"}
            </h2>
            <p className="text-xs text-muted leading-relaxed">
              {isSignUp ? "Start indexing your career achievements today" : "Access your AI Career Intelligence telemetry"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="flex items-start space-x-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-semibold">
                <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted tracking-wider">Full Name</label>
                <div className="flex items-center bg-accent/20 border border-border rounded-xl px-3.5 py-2.5 transition-all focus-within:border-primary/50">
                  <UserIcon className="w-4 h-4 text-muted mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder-muted"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted tracking-wider">Email Address</label>
              <div className="flex items-center bg-accent/20 border border-border rounded-xl px-3.5 py-2.5 transition-all focus-within:border-primary/50">
                <Mail className="w-4 h-4 text-muted mr-2 shrink-0" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder-muted"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted tracking-wider">Password</label>
              <div className="flex items-center bg-accent/20 border border-border rounded-xl px-3.5 py-2.5 transition-all focus-within:border-primary/50">
                <KeyRound className="w-4 h-4 text-muted mr-2 shrink-0" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder-muted"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-xs font-bold rounded-xl mt-4 flex items-center justify-center cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isSignUp ? "Register Account" : "Sign In"}</span>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-xs text-muted hover:text-primary font-medium transition-colors cursor-pointer"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
