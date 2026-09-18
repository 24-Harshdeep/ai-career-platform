"use client";

import React, { useState } from "react";
import { Mail, KeyRound, User as UserIcon, ShieldAlert, Eye, EyeOff, ArrowRight, Target, Briefcase, TrendingUp, Sparkles, CheckCircle2 } from "lucide-react";

interface LoginViewProps {
  onSignIn: (email?: string, password?: string) => Promise<boolean>;
  onSignUp: (name: string, email: string, password: string) => Promise<boolean>;
  onQuickDemoLogin?: (role: string, name: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSignIn, onSignUp, onQuickDemoLogin }) => {
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
        setError(isSignUp ? "Registration failed. Email might already be registered." : "Invalid email or password credentials.");
      }
    } catch (err) {
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
    } else if (onQuickDemoLogin) {
      onQuickDemoLogin("Senior Developer", "Alex Chen");
      window.location.href = "/dashboard";
      return;
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen w-full bg-[#F4F7FF] text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* 🌊 Soft Fluid Gradient Background Mesh Orbs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-200/50 via-blue-100/40 to-transparent blur-[120px] pointer-events-none animate-pulse duration-[10000ms]" />
      <div className="absolute top-1/4 right-0 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-purple-200/40 via-indigo-100/30 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-blue-200/40 via-sky-100/30 to-transparent blur-[130px] pointer-events-none" />

      {/* 🔝 Top Header Section */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
        <div className="flex items-center space-x-3">
          {/* Logo Emblem */}
          <div className="w-9 h-9 overflow-hidden relative shrink-0 flex items-center justify-center">
            <img 
              src="/logo1.png" 
              alt="CareerOS Logo" 
              className="w-full h-full object-contain scale-110"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-slate-900">CareerOS</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200/80">AI 2.0</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 tracking-tight">Smarter Talent Decisions. Brighter Futures.</p>
          </div>
        </div>
      </header>

      {/* 🏛️ Main Content Grid: 3-Columns Layout */}
      <main className="w-full max-w-7xl mx-auto px-6 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-20 flex-1">
        
        {/* 👈 LEFT COLUMN: Feature Value Proposition Stack */}
        <div className="lg:col-span-3 hidden lg:flex flex-col justify-between space-y-10 py-4">
          <div className="space-y-6">
            {/* Feature 1 */}
            <div className="group flex items-start space-x-4 p-3 rounded-2xl transition-all duration-300 hover:bg-white/60 hover:shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Target className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">Better Skills</h3>
                <p className="text-[11px] font-medium text-slate-500 leading-snug">Build the right skills for tomorrow</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group flex items-start space-x-4 p-3 rounded-2xl transition-all duration-300 hover:bg-white/60 hover:shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 shrink-0 shadow-xs group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">Better Opportunities</h3>
                <p className="text-[11px] font-medium text-slate-500 leading-snug">Connect with top career opportunities</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group flex items-start space-x-4 p-3 rounded-2xl transition-all duration-300 hover:bg-white/60 hover:shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600 shrink-0 shadow-xs group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">Brighter Careers</h3>
                <p className="text-[11px] font-medium text-slate-500 leading-snug">Grow, achieve, succeed</p>
              </div>
            </div>
          </div>

          {/* Bottom Left Statement */}
          <div className="pt-6 border-t border-slate-200/60 space-y-2">
            <h4 className="text-sm font-extrabold text-slate-800 leading-snug">
              Your Career.<br />
              <span className="text-indigo-600">Our Intelligence.</span>
            </h4>
            <div className="w-10 h-1 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full" />
          </div>
        </div>

        {/* 🎯 CENTER COLUMN: Soft Glass Login Card */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="w-full max-w-[430px] bg-white/85 backdrop-blur-xl border border-white/90 rounded-[36px] shadow-[0_25px_60px_-15px_rgba(99,102,241,0.16)] p-7 sm:p-9 relative z-20 transition-all duration-300 hover:shadow-[0_30px_70px_-15px_rgba(99,102,241,0.22)]">
            
            {/* Card Header Logo */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 overflow-hidden relative shrink-0 mb-3 flex items-center justify-center">
                <img 
                  src="/logo1.png" 
                  alt="CareerOS Logo" 
                  className="w-full h-full object-contain scale-110"
                />
              </div>
              
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {isSignUp ? "Create your Account" : "Sign in to CareerOS"}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {isSignUp ? "Join thousands of professionals optimizing their career paths" : "Access your AI Career & Talent Intelligence platform"}
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-5 flex items-start space-x-3 p-3.5 bg-rose-50 border border-rose-200/80 text-rose-600 rounded-2xl text-xs font-semibold animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block ml-1">
                    FULL NAME
                  </label>
                  <div className="relative flex items-center bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white">
                    <UserIcon className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                    <input
                      type="text"
                      placeholder="Alex Chen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-slate-900 w-full placeholder-slate-400 font-medium"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block ml-1">
                  EMAIL ADDRESS
                </label>
                <div className="relative flex items-center bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-slate-900 w-full placeholder-slate-400 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block ml-1">
                  PASSWORD
                </label>
                <div className="relative flex items-center bg-slate-50/90 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white">
                  <KeyRound className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-slate-900 w-full pr-8 placeholder-slate-400 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-700 hover:via-indigo-600 hover:to-blue-700 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-70 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? "Register Account" : "Sign In"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Login Option */}
            {!isSignUp && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("alex@careeros.dev", "password123")}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200/80 transition-all hover:scale-105 cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Auto-fill Demo Credentials</span>
                </button>
              </div>
            )}

            {/* Mode Switch Toggle Link */}
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
              >
                {isSignUp ? (
                  <span>Already have an account? <strong className="text-indigo-600 hover:underline">Sign In</strong></span>
                ) : (
                  <span>Don't have an account? <strong className="text-indigo-600 hover:underline">Sign Up.</strong></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 👉 RIGHT COLUMN: Interactive 3D Dashboard Mockup Scene */}
        <div className="lg:col-span-4 hidden lg:flex flex-col items-center lg:items-end justify-center relative">
          
          {/* Top Pill Badge: Find • Learn • Grow */}
          <div className="mb-4 self-center lg:self-end px-4 py-1.5 rounded-full bg-white/80 border border-slate-200/70 backdrop-blur-md shadow-xs text-[11px] font-bold text-slate-600 tracking-wider flex items-center space-x-1.5 animate-bounce-slow">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Find • Learn • Grow</span>
          </div>

          {/* Floating Glass Graphic Box */}
          <div className="relative w-full max-w-[420px] aspect-[4/3.5] rounded-3xl overflow-hidden shadow-2xl border border-white/80 bg-gradient-to-tr from-white/90 to-indigo-50/50 backdrop-blur-md group hover:scale-[1.02] transition-transform duration-500">
            {/* 3D Generated Mockup Image */}
            <img 
              src="/dashboard_mockup_3d.png" 
              alt="CareerOS AI Dashboard Telemetry Preview"
              className="w-full h-full object-cover rounded-3xl"
            />
            
            {/* Subtle Overlay Glass Highlights */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-white/10 pointer-events-none" />
            
            {/* Floating Live Indicator Badge */}
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] font-bold text-slate-800">AI Career Intelligence Engine</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 🦶 Footer Bar */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/50 text-[11px] text-slate-400 font-medium relative z-20">
        <div>© 2026 CareerOS Inc. All rights reserved.</div>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Security</a>
        </div>
      </footer>
    </div>
  );
};

export default LoginView;
