"use client";

import React, { useState } from "react";
import {
  Mail,
  KeyRound,
  User as UserIcon,
  ShieldAlert,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface LoginViewProps {
  onSignIn: (email?: string, password?: string) => Promise<boolean>;
  onSignUp: (name: string, email: string, password: string) => Promise<boolean>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSignIn, onSignUp }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      let success = false;
      if (isSignUp) {
        success = await onSignUp(name, email, password);
      } else {
        success = await onSignIn(email, password);
      }

      if (success) {
        window.location.href = "/dashboard";
        return;
      } else {
        setError(
          isSignUp
            ? "Registration failed. Email might already be registered."
            : "Invalid email or password credentials."
        );
      }
    } catch {
      setError("Unable to connect to authentication server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setLoading(true);
    setError("");

    const success = await onSignIn(userEmail, userPass);
    if (success) {
      window.location.href = "/dashboard";
      return;
    }
    setError("Demo sign-in failed. Start the API with demo mode enabled or use your account.");
    setLoading(false);
  };

  return (
    <div className="login-reference-page min-h-screen w-full flex overflow-hidden font-sans">
      <div
        className="login-reference-form-side ml-auto flex min-h-screen w-[43%] flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "transparent", minHeight: "100vh" }}
      >
        {/* Mobile-only top logo bar */}
        <div className="lg:hidden w-full px-6 pt-6 pb-4 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo1.png" alt="CareerOS" className="w-full h-full object-contain" />
            </div>
            <span className="text-[16px] font-black tracking-tight text-slate-900">CareerOS</span>
          </div>
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="text-[11px] font-bold text-indigo-600 flex items-center space-x-1 cursor-pointer"
          >
            <span>{isSignUp ? "Sign In" : "Sign Up"}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Form card */}
        <div className="relative z-10 w-full max-w-[420px] mx-auto px-6">
          {/* Logo + heading */}
          <div className="flex flex-col items-center text-center mb-7">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #ede9fe, #dbeafe)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <img src="/logo1.png" alt="CareerOS" className="w-10 h-10 object-contain" />
            </div>

            <h1 className="text-[22px] font-black tracking-tight text-slate-900">
              {isSignUp ? "Create your Account" : "Welcome Back"}
            </h1>
            <p className="text-[12px] text-slate-500 font-medium mt-1">
              {isSignUp
                ? "Join thousands of professionals optimizing their career"
                : "Sign in to continue your journey"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start space-x-3 p-3.5 rounded-xl text-[12px] font-semibold"
              style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c" }}>
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">Full Name</label>
                <div
                  className="flex items-center rounded-xl px-3.5 py-3 transition-all"
                  style={{
                    background: "#fff",
                    border: "1.5px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                  onFocus={() => {}}
                >
                  <UserIcon className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                  <input
                    type="text"
                    placeholder="Alex Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent border-none outline-none text-[13px] text-slate-900 w-full placeholder-slate-400 font-medium"
                    required={isSignUp}
                    style={{ caretColor: "#4f46e5" }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">Email Address</label>
              <div
                className="flex items-center rounded-xl px-3.5 py-3 transition-all"
                style={{
                  background: "#fff",
                  border: "1.5px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none outline-none text-[13px] text-slate-900 w-full placeholder-slate-400 font-medium"
                  required
                  style={{ caretColor: "#4f46e5" }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">Password</label>
              <div
                className="flex items-center rounded-xl px-3.5 py-3 transition-all relative"
                style={{
                  background: "#fff",
                  border: "1.5px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <KeyRound className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none text-[13px] text-slate-900 w-full placeholder-slate-400 font-medium pr-8"
                  required
                  style={{ caretColor: "#4f46e5" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            {!isSignUp && (
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-500 font-medium select-none">Remember me</span>
                </label>
                <span className="text-[11px] font-bold text-indigo-600 cursor-pointer hover:underline">
                  Forgot password?
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-[13px] font-bold flex items-center justify-center space-x-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-70 mt-1"
              style={{
                background: "linear-gradient(90deg, #4f46e5, #6d28d9)",
                boxShadow: "0 4px 20px rgba(79,70,229,0.35)",
              }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo record card — only on sign-in */}
          {!isSignUp && (
            <>
              {/* Divider */}
              <div className="flex items-center space-x-3 my-5">
                <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
                <span className="text-[11px] font-medium text-slate-400">or try a live demo</span>
                <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
              </div>

              {/* Demo card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  border: "1.5px solid rgba(99,102,241,0.25)",
                  background: "linear-gradient(135deg, #fafaff 0%, #f0f0ff 100%)",
                  boxShadow: "0 2px 12px rgba(99,102,241,0.10)",
                }}
              >
                {/* Card header */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{
                    background: "linear-gradient(90deg, rgba(99,102,241,0.10), rgba(139,92,246,0.08))",
                    borderBottom: "1px solid rgba(99,102,241,0.12)",
                  }}
                >
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3 h-3" style={{ color: "#6366f1" }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6366f1" }}>
                      Demo Account
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(16,185,129,0.12)",
                      color: "#059669",
                      border: "1px solid rgba(16,185,129,0.25)",
                    }}
                  >
                    ● Live Data
                  </span>
                </div>

                {/* Persona row */}
                <div className="px-4 pt-3.5 pb-1 flex items-center space-x-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-[13px] font-black text-white"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
                    }}
                  >
                    AC
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-900 leading-none mb-0.5">Alex Chen</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">Software Engineer · San Francisco</p>
                  </div>
                  {/* Feature pills */}
                  <div className="hidden sm:flex flex-col items-end space-y-1 shrink-0">
                    {["Resume AI", "Roadmap", "Coach"].map((f) => (
                      <span
                        key={f}
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(99,102,241,0.10)",
                          color: "#6366f1",
                          border: "1px solid rgba(99,102,241,0.18)",
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Credential rows */}
                <div className="px-4 pb-1 pt-2 space-y-1.5">
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(226,232,240,0.7)" }}
                  >
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Email</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 font-mono">alex@careeros.dev</span>
                  </div>
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(226,232,240,0.7)" }}
                  >
                    <div className="flex items-center space-x-2">
                      <KeyRound className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Password</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 font-mono">password123</span>
                  </div>
                </div>

                {/* CTA button */}
                <div className="px-4 pb-4 pt-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin("alex@careeros.dev", "password123")}
                    className="w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center space-x-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-60"
                    style={{
                      background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                      color: "#fff",
                      boxShadow: "0 3px 14px rgba(99,102,241,0.32)",
                    }}
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Enter Demo — No Sign-up Needed</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Switch mode */}
          <div className="text-center mt-5">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-[12px] text-slate-500 font-medium transition-colors cursor-pointer hover:text-slate-800"
            >
              {isSignUp ? (
                <span>
                  Already have an account?{" "}
                  <strong className="text-indigo-600 hover:underline">Sign in</strong>{" "}
                  <ArrowRight className="inline w-3 h-3 text-indigo-600" />
                </span>
              ) : (
                <span>
                  Don&apos;t have an account?{" "}
                  <strong className="text-indigo-600 hover:underline">Create one</strong>{" "}
                  <ArrowRight className="inline w-3 h-3 text-indigo-600" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-[10px] font-medium text-slate-400 text-center">
          © 2026 CareerOS Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginView;
