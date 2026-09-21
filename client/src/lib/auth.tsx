"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import { KeyRound, Mail, User as UserIcon, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useCareerStore } from "@/store/careerStore";
import { API_BASE_URL, safeParseJson } from "@/lib/api";

import { LoginView } from "@/components/auth/LoginView";

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
const API_URL = `${API_BASE_URL}/auth`;

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session>({
    user: { name: "", email: "", role: "" },
    status: "loading",
  });

  // Session Recovery & 401 Expiry Handler
  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem("careeros_token");
      setSession({
        user: { name: "", email: "", role: "" },
        status: "unauthenticated",
      });
    };
    window.addEventListener("careeros_auth_expired", handleAuthExpired);

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
          const data = await safeParseJson(res);
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
        // Network offline/server unreachable
        setSession({
          user: { name: "", email: "", role: "" },
          status: "unauthenticated",
        });
      }
    };

    recoverSession();
    return () => window.removeEventListener("careeros_auth_expired", handleAuthExpired);
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
        const data = await safeParseJson(res);
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
        const data = await safeParseJson(res);
        localStorage.setItem("careeros_token", data.token);
        localStorage.setItem("careeros_show_profile_onboarding", "true");
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
    const demoToken = "demo_careeros_token_" + Date.now();
    localStorage.setItem("careeros_token", demoToken);
    setSession({
      user: {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@careeros.dev`,
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
  const { session, signIn, signUp, switchUser } = useSession();
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Onboarding profile inputs
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [githubUrlOnboard, setGithubUrlOnboard] = useState("");
  const [linkedinUrlOnboard, setLinkedinUrlOnboard] = useState("");
  const [portfolioUrlOnboard, setPortfolioUrlOnboard] = useState("");
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardError, setOnboardError] = useState("");

  useEffect(() => {
    if (session.status === "authenticated") {
      const show = localStorage.getItem("careeros_show_profile_onboarding");
      if (show === "true") {
        setShowOnboarding(true);
      }
    }
  }, [session.status]);

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
    return <LoginView onSignIn={signIn} onSignUp={signUp} onQuickDemoLogin={switchUser} />;
  }

  const handleSkipOnboarding = async () => {
    localStorage.removeItem("careeros_show_profile_onboarding");
    try {
      await fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
    setShowOnboarding(false);
    window.location.href = "/dashboard";
  };

  const handleSaveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError("");
    setOnboardLoading(true);

    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    if (githubUrlOnboard && !urlPattern.test(githubUrlOnboard)) {
      setOnboardError("Please enter a valid GitHub Profile URL.");
      setOnboardLoading(false);
      return;
    }
    if (linkedinUrlOnboard && !urlPattern.test(linkedinUrlOnboard)) {
      setOnboardError("Please enter a valid LinkedIn Profile URL.");
      setOnboardLoading(false);
      return;
    }
    if (portfolioUrlOnboard && !urlPattern.test(portfolioUrlOnboard)) {
      setOnboardError("Please enter a valid Portfolio Website URL.");
      setOnboardLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("careeros_token");
       const res = await fetch(`${API_BASE_URL}/career/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          githubUrl: githubUrlOnboard,
          linkedinUrl: linkedinUrlOnboard,
          portfolioUrl: portfolioUrlOnboard
        })
      });

      if (res.ok) {
        localStorage.removeItem("careeros_show_profile_onboarding");
        try {
          await fetchDashboardData();
        } catch (e) {
          console.error(e);
        }
        setShowOnboarding(false);
        window.location.href = "/dashboard";
      } else {
        setOnboardError("Failed to save links. Please try again.");
      }
    } catch (err) {
      setOnboardError("Network connection error. Try again.");
    } finally {
      setOnboardLoading(false);
    }
  };

  if (showOnboarding) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Abstract background graphics */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

        <Card className="w-full max-w-md p-8 bg-card/60 border-border/80 backdrop-blur-lg rounded-3xl shadow-2xl relative z-10 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              Complete Your Professional Profile
            </h2>
            <p className="text-xs text-muted leading-relaxed">
              Add your professional links to help build a stronger profile. You can skip this step and add them later.
            </p>
          </div>

          <form onSubmit={handleSaveOnboarding} className="space-y-4 pt-2">
            {onboardError && (
              <div className="flex items-start space-x-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-semibold">
                <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{onboardError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted tracking-wider">GitHub Profile URL (Optional)</label>
              <div className="flex items-center bg-accent/20 border border-border rounded-xl px-3.5 py-2.5 transition-all focus-within:border-primary/50">
                <input
                  type="text"
                  placeholder="https://github.com/username"
                  value={githubUrlOnboard}
                  onChange={(e) => setGithubUrlOnboard(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder-muted"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted tracking-wider">LinkedIn Profile URL (Optional)</label>
              <div className="flex items-center bg-accent/20 border border-border rounded-xl px-3.5 py-2.5 transition-all focus-within:border-primary/50">
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrlOnboard}
                  onChange={(e) => setLinkedinUrlOnboard(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder-muted"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted tracking-wider">Portfolio Website URL (Optional)</label>
              <div className="flex items-center bg-accent/20 border border-border rounded-xl px-3.5 py-2.5 transition-all focus-within:border-primary/50">
                <input
                  type="text"
                  placeholder="https://yourportfolio.dev"
                  value={portfolioUrlOnboard}
                  onChange={(e) => setPortfolioUrlOnboard(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder-muted"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={handleSkipOnboarding}
                className="flex-1 py-3 text-xs font-bold rounded-xl border border-border hover:bg-accent/20 text-muted transition-colors cursor-pointer text-center animate-pulse"
              >
                Skip for Now
              </button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer"
                disabled={onboardLoading}
              >
                {onboardLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Save & Continue</span>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
