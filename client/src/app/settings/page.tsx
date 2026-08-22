"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import {
  Settings,
  User,
  Key,
  Bell,
  Shield,
  LogOut,
  UserCheck,
  Sparkles,
  FileText,
  CheckCircle,
  X,
  ChevronRight,
  TrendingUp,
  Award,
  AlertTriangle,
  Clock,
  Target
} from "lucide-react";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";

type SettingsTab = "profile" | "ai" | "documents" | "notifications" | "accounts" | "theme" | "security";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const storeUser = useCareerStore((state) => state.user);
  const profile = useCareerStore((state) => state.profile);
  const updateProfileSettings = useCareerStore((state) => state.updateProfileSettings);
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);
  const addNotification = useCareerStore((state) => state.addNotification);

  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Form states: Profile & Career
  const [nameInput, setNameInput] = useState(storeUser?.name || user?.name || "");
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [targetRoleInput, setTargetRoleInput] = useState(profile?.targetRole || storeUser?.goal || "");
  const [experienceInput, setExperienceInput] = useState<"Beginner" | "Intermediate" | "Advanced">(
    (profile?.experienceLevel as any) || (storeUser?.experience as any) || "Intermediate"
  );
  const [industryInput, setIndustryInput] = useState("Fintech");
  const [countryInput, setCountryInput] = useState("United States");
  const [salaryInput, setSalaryInput] = useState("$130,000");
  const [workTypeInput, setWorkTypeInput] = useState<"Remote" | "Hybrid" | "Onsite">("Remote");

  // Form states: AI Preferences
  const [aiPersonality, setAiPersonality] = useState("Career Coach");
  const [aiResponseLength, setAiResponseLength] = useState("Detailed");
  const [learningStyle, setLearningStyle] = useState("Practical");
  const [recommendationFreq, setRecommendationFreq] = useState("Daily");
  const [aiTemperature, setAiTemperature] = useState(0.5);

  // Form states: Resume Defaults & Links
  const [primaryResume, setPrimaryResume] = useState("");
  const [primaryPortfolio, setPrimaryPortfolio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Load and synchronize profile
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (storeUser) {
      setNameInput(storeUser.name || "");
      setEmailInput(storeUser.email || "harshdeep@career.os");
    }
  }, [storeUser]);

  useEffect(() => {
    if (profile && !profileLoaded) {
      setTargetRoleInput(profile.targetRole || "Backend Developer");
      setExperienceInput((profile.experienceLevel as any) || "Intermediate");
      setIndustryInput(profile.preferredIndustry || "Fintech");
      setCountryInput(profile.countryLocale || "United States");
      setSalaryInput(profile.targetSalary || "$130,000");
      setWorkTypeInput((profile.workType as any) || "Remote");
      setGithubUrl(profile.githubUrl ?? "");
      setAiPersonality(profile.aiPersonality || "Career Coach");
      setAiResponseLength(profile.aiResponseLength || "Detailed");
      setLearningStyle(profile.preferredLearningStyle || "Practical");
      setRecommendationFreq(profile.aiRecommendationFreq || "Daily");
      setAiTemperature(profile.aiTemperature !== undefined ? profile.aiTemperature : 0.5);
      setThemeMode(profile.themeMode || "Dark");
      setAccentColor(profile.accentColor || "Purple");
      setPrimaryResume(profile.primaryResume || "");
      setPrimaryPortfolio(profile.primaryPortfolio || "GitHub Integration Portfolio");
      setLinkedinUrl(profile.linkedinUrl ?? "");
      setPortfolioUrl(profile.portfolioUrl ?? "");
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  // Form states: Notifications
  const [notifSettings, setNotifSettings] = useState({
    scoreAlerts: true,
    roadmapAlerts: true,
    resumeAlerts: true,
    weaknessAlerts: false,
    reminderAlerts: true,
    missionAlerts: true,
    digestAlerts: false
  });

  // Form states: Connected Accounts toggles (interactive demo simulation)
  const [connectedAccs, setConnectedAccs] = useState<Record<string, boolean>>({
    GitHub: true,
    LinkedIn: false,
    Google: true,
    "OpenAI / Gemini API": true
  });

  // Form states: Theme
  const [themeMode, setThemeMode] = useState("Dark");
  const [accentColor, setAccentColor] = useState("Purple");

  const handleToggleNotif = (name: string) => {
    setNotifSettings((prev) => {
      const next = { ...prev, [name]: !prev[name as keyof typeof prev] };
      addNotification(
        `${name.replace("Alerts", "")} notifications updated.`,
        "info"
      );
      return next;
    });
  };

  const handleToggleAccount = (name: string) => {
    setConnectedAccs((prev) => {
      const isConnected = !prev[name];
      addNotification(
        `${name} account ${isConnected ? "connected" : "disconnected"} successfully.`,
        isConnected ? "success" : "warning"
      );
      return { ...prev, [name]: isConnected };
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfileSettings({
      name: nameInput,
      email: emailInput,
      targetRole: targetRoleInput,
      experienceLevel: experienceInput,
      preferredIndustry: industryInput,
      countryLocale: countryInput,
      targetSalary: salaryInput,
      workType: workTypeInput,
      githubUrl: githubUrl
    });
    addNotification("Profile and target career preferences synchronized successfully.", "success");
    setSaving(false);
    setProfileLoaded(false);
  };

  const handleSaveAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfileSettings({
      aiPersonality,
      aiResponseLength,
      preferredLearningStyle: learningStyle,
      aiRecommendationFreq: recommendationFreq,
      aiTemperature
    });
    addNotification("AI personality and model parameters synchronized successfully.", "success");
    setSaving(false);
    setProfileLoaded(false);
  };

  const handleSaveDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfileSettings({
      primaryResume,
      primaryPortfolio,
      linkedinUrl,
      githubUrl,
      portfolioUrl
    });
    addNotification("Document defaults and external links saved successfully.", "success");
    setSaving(false);
    setProfileLoaded(false);
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfileSettings({
      themeMode,
      accentColor
    });
    localStorage.setItem("careeros_theme", themeMode);
    localStorage.setItem("careeros_accent", accentColor);
    addNotification("Theme appearance and color preferences synchronized successfully.", "success");
    setSaving(false);
    setProfileLoaded(false);
  };

  const handleSelectThemeMode = (theme: string) => {
    setThemeMode(theme);
    const root = document.documentElement;
    if (theme === "Dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
  };

  const handleSelectAccentColor = (color: string) => {
    setAccentColor(color);
    const root = document.documentElement;
    const colors: Record<string, { primary: string; secondary: string }> = {
      Purple: { primary: "#6366F1", secondary: "#8B5CF6" },
      Blue: { primary: "#2563EB", secondary: "#3B82F6" },
      Emerald: { primary: "#059669", secondary: "#10B981" },
      Indigo: { primary: "#4F46E5", secondary: "#6366F1" },
      Amber: { primary: "#D97706", secondary: "#F59E0B" },
      Rose: { primary: "#E11D48", secondary: "#F43F5E" }
    };
    const choice = colors[color] || colors.Purple;
    root.style.setProperty("--primary", choice.primary);
    root.style.setProperty("--secondary", choice.secondary);
  };

  const handleMockSignOut = async () => {
    await signOut();
    addNotification("Logged out successfully.", "info");
  };

  return (
    <PageTransition className="space-y-6 pb-12">
      <StaggerItem>
        <PageHeader
          icon={Settings}
          title="System Configuration"
          description="Configure profile targets, customize AI behavior, manage links, and review connected accounts."
        />
      </StaggerItem>

      {/* Grid: Left tabs menu sidebar vs Right forms card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-1 bg-accent/5 p-2 rounded-2xl border border-border/60 h-fit">
          {[
            { id: "profile", label: "Profile & Career", icon: User },
            { id: "ai", label: "AI Configuration", icon: Sparkles },
            { id: "documents", label: "Resumes & Links", icon: FileText },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "accounts", label: "Connected Accounts", icon: Shield },
            { id: "theme", label: "Appearance & Theme", icon: Settings },
            { id: "security", label: "Security & Privacy", icon: Key }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground hover:bg-accent/10"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-border/40">
            <button
              onClick={handleMockSignOut}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-danger hover:bg-danger/10 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Column: Forms panel card */}
        <div className="lg:col-span-9">
          <Card className="p-6">
            
            {/* 1. Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-border pb-3">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Profile & Career Target</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Candidate Name</label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Email Address</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Target Role</label>
                    <select
                      value={targetRoleInput}
                      onChange={(e) => setTargetRoleInput(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="DevOps Engineer">DevOps Engineer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Experience Bracket</label>
                    <select
                      value={experienceInput}
                      onChange={(e) => setExperienceInput(e.target.value as any)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="Beginner">Beginner (0-2 Years)</option>
                      <option value="Intermediate">Intermediate (2-5 Years)</option>
                      <option value="Advanced">Advanced (5+ Years)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Preferred Industry</label>
                    <select
                      value={industryInput}
                      onChange={(e) => setIndustryInput(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="Fintech">Fintech</option>
                      <option value="SaaS / Enterprise">SaaS / Enterprise</option>
                      <option value="AI & Machine Learning">AI & Machine Learning</option>
                      <option value="Healthcare Tech">Healthcare Tech</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Country Locale</label>
                    <select
                      value={countryInput}
                      onChange={(e) => setCountryInput(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="India">India</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Target Salary (Annual USD)</label>
                    <input
                      type="text"
                      value={salaryInput}
                      onChange={(e) => setSalaryInput(e.target.value)}
                      placeholder="e.g. $130,000"
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase block">Work Environment Type</label>
                    <div className="flex gap-4 pt-2 text-xs">
                      {(["Remote", "Hybrid", "Onsite"] as const).map((wType) => (
                        <label key={wType} className="flex items-center space-x-2 cursor-pointer text-foreground">
                          <input
                            type="radio"
                            name="workType"
                            checked={workTypeInput === wType}
                            onChange={() => setWorkTypeInput(wType)}
                            className="text-primary focus:ring-primary"
                          />
                          <span>{wType}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" variant="ai" isLoading={saving} className="px-6 text-xs font-semibold">
                    Save Preferences
                  </Button>
                </div>
              </form>
            )}

            {/* 2. AI Tab */}
            {activeTab === "ai" && (
              <form onSubmit={handleSaveAI} className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-border pb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">AI Intelligence Preferences</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">AI Coach Personality</label>
                    <select
                      value={aiPersonality}
                      onChange={(e) => setAiPersonality(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="Mentor">Mentor (Encouraging & Explaining)</option>
                      <option value="Recruiter">Recruiter (ATS & Keyword Focused)</option>
                      <option value="Career Coach">Career Coach (Goal & Action Oriented)</option>
                      <option value="Strict Interviewer">Strict Interviewer (Rigorous & Technical)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Response Length</label>
                    <select
                      value={aiResponseLength}
                      onChange={(e) => setAiResponseLength(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="Short">Short (Concise & Bulleted)</option>
                      <option value="Medium">Medium (Balanced)</option>
                      <option value="Detailed">Detailed (Elaborate & Architectural)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Preferred Learning Style</label>
                    <select
                      value={learningStyle}
                      onChange={(e) => setLearningStyle(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="Visual">Visual (Diagrams & Flowcharts)</option>
                      <option value="Practical">Practical (Code & Implementation Tasks)</option>
                      <option value="Theory">Theory (Concepts & Best Practices)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Recommendation Frequency</label>
                    <select
                      value={recommendationFreq}
                      onChange={(e) => setRecommendationFreq(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      <option value="Daily">Daily Actions</option>
                      <option value="Weekly">Weekly Actions</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <div className="flex justify-between text-[10px] text-muted font-bold uppercase">
                      <span>AI Model Temperature</span>
                      <span className="text-foreground">{aiTemperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="0.8"
                      step="0.1"
                      value={aiTemperature}
                      onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-accent rounded-lg appearance-none cursor-pointer accent-primary mt-2"
                    />
                    <span className="text-[9px] text-muted block mt-1">Lower values are more precise; higher values are more creative.</span>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" variant="ai" isLoading={saving} className="px-6 text-xs font-semibold">
                    Save AI Preferences
                  </Button>
                </div>
              </form>
            )}

            {/* 3. Resumes Tab */}
            {activeTab === "documents" && (
              <form onSubmit={handleSaveDocs} className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-border pb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Document Defaults & URLs</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Primary Resume Source</label>
                    <select
                      value={primaryResume}
                      onChange={(e) => setPrimaryResume(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                    >
                      {primaryResume && <option value={primaryResume}>{primaryResume} (Primary)</option>}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">Primary Portfolio</label>
                    <input
                      type="text"
                      value={primaryPortfolio}
                      onChange={(e) => setPrimaryPortfolio(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">LinkedIn Profile Link</label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted font-bold uppercase">GitHub Profile Link</label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] text-muted font-bold uppercase">Portfolio Website URL</label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" variant="ai" isLoading={saving} className="px-6 text-xs font-semibold">
                    Save Document Links
                  </Button>
                </div>
              </form>
            )}

            {/* 4. Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-border pb-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "scoreAlerts", label: "Career Score Changes", desc: "Instantly alert me when my overall score goes up or down." },
                    { name: "roadmapAlerts", label: "Roadmap Completed Checkpoints", desc: "Notify me when I verify milestone sub-checkpoints." },
                    { name: "resumeAlerts", label: "Resume Improved Diagnostics", desc: "Alert me when my ATS resume score is recalculated." },
                    { name: "weaknessAlerts", label: "New Weak Areas Detected", desc: "Warn me when mock interviews flag recurring concept mistakes." },
                    { name: "reminderAlerts", label: "Interview Simulation Reminders", desc: "Send reminders for scheduled mock interviews." },
                    { name: "missionAlerts", label: "Daily Mission Syncs", desc: "Notify me when the daily checklist updates in Career DNA." },
                    { name: "digestAlerts", label: "Weekly Performance Digests", desc: "Send an email summary of my weekly progression." }
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3.5 bg-accent/10 border border-border rounded-xl">
                      <div className="space-y-1 pr-4 text-xs">
                        <span className="font-bold text-foreground">{item.label}</span>
                        <p className="text-[10px] text-muted leading-relaxed">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifSettings[item.name as keyof typeof notifSettings]}
                        onChange={() => handleToggleNotif(item.name)}
                        className="w-8.5 h-4 bg-gray-200 rounded-full appearance-none cursor-pointer relative checked:bg-primary before:content-[''] before:absolute before:h-3 before:w-3 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-all checked:before:left-5"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Connected Accounts Tab */}
            {activeTab === "accounts" && (
              <div className="space-y-5">
                <div className="flex items-center space-x-2 border-b border-border pb-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Connected Accounts & Integrations</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "GitHub", connected: connectedAccs.GitHub, details: "Syncs repositories, readme audits, and code velocity stats." },
                    { name: "LinkedIn", connected: connectedAccs.LinkedIn, details: "Crawls matching job alerts and exports professional profiles." },
                    { name: "Google", connected: connectedAccs.Google, details: "Connects email digests and schedules calendar prep alerts." },
                    { name: "OpenAI / Gemini API", connected: connectedAccs["OpenAI / Gemini API"], details: "Powers customized AI coaching and resume tailors." }
                  ].map((acc) => (
                    <div key={acc.name} className="p-4 bg-accent/10 border border-border rounded-2xl flex flex-col justify-between hover:bg-accent/15 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{acc.name}</span>
                          <Badge variant={acc.connected ? "success" : "muted"}>
                            {acc.connected ? "Connected" : "Disconnected"}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted leading-relaxed">{acc.details}</p>
                      </div>
                      <div className="flex justify-end pt-4">
                        <Button
                          variant={acc.connected ? "secondary" : "primary"}
                          size="sm"
                          onClick={() => handleToggleAccount(acc.name)}
                          className="text-[10px] py-1 px-3 cursor-pointer"
                        >
                          {acc.connected ? "Configure" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-border/40 space-y-3">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Additional Developer Integrations</span>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {["LeetCode", "Codeforces", "HackerRank"].map((platform) => (
                      <div key={platform} className="p-3 bg-accent/5 border border-border rounded-xl flex items-center justify-between">
                        <span className="font-semibold text-foreground">{platform}</span>
                        <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary cursor-pointer" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. Theme Tab */}
            {activeTab === "theme" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-border pb-3">
                  <Settings className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Theme & Interface Appearance</h3>
                </div>

                <div className="space-y-4 text-xs">


                                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] text-muted font-bold uppercase">Interface Accent Color</span>
                    <div className="flex flex-wrap gap-3">
                      {["Purple", "Blue", "Emerald", "Indigo", "Amber", "Rose"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleSelectAccentColor(color)}
                          className={`px-3 py-1.5 border rounded-lg font-semibold cursor-pointer text-[11px] ${
                            accentColor === color 
                              ? color === "Purple" ? "bg-indigo-600 border-indigo-600 text-white"
                                : color === "Blue" ? "bg-blue-600 border-blue-600 text-white"
                                : color === "Emerald" ? "bg-emerald-600 border-emerald-600 text-white"
                                : color === "Indigo" ? "bg-violet-600 border-violet-600 text-white"
                                : color === "Amber" ? "bg-amber-600 border-amber-600 text-white"
                                : "bg-rose-600 border-rose-600 text-white"
                              : "bg-card border-border hover:bg-accent/10 text-foreground"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-accent/10 border border-border rounded-xl">
                    <div className="space-y-1 pr-4">
                      <span className="font-bold text-foreground">Subtle Dashboard Animations</span>
                      <p className="text-[10px] text-muted">Toggle fade-in triggers, pulse rings, and progress loops.</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-8.5 h-4 bg-gray-200 rounded-full appearance-none cursor-pointer relative checked:bg-primary before:content-[''] before:absolute before:h-3 before:w-3 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-all checked:before:left-5"
                    />
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleSaveTheme}
                      isLoading={saving}
                    >
                      Save Appearance Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-5">
                <div className="flex items-center space-x-2 border-b border-border pb-3">
                  <Key className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Security Credentials & Privacy Control</h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="bg-success/5 border border-success/20 rounded-xl p-3.5 flex items-start space-x-2.5">
                    <CheckCircle className="w-4.5 h-4.5 text-success shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-success">Active Session Secured</span>
                      <p className="text-[10px] text-muted">Currently authenticated from Seattle, WA (Chrome Browser on Linux OS).</p>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-2xl space-y-3 bg-accent/5">
                    <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Privacy & Logs Control</span>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted">Profile Visibility</span>
                        <Badge variant="primary">Private (Only You)</Badge>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted">Store AI Conversation History</span>
                        <input type="checkbox" defaultChecked className="rounded border-border text-primary cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="secondary" onClick={() => addNotification("Career data exported successfully.", "success")} className="text-xs font-semibold cursor-pointer">
                      Export Career Data
                    </Button>
                    <Button variant="secondary" onClick={() => addNotification("AI conversation history cleared.", "info")} className="text-xs font-semibold cursor-pointer">
                      Clear AI Chat Logs
                    </Button>
                  </div>

                  <div className="border-t border-border/40 pt-4 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-foreground">Deactivate Account</span>
                      <p className="text-[10px] text-muted">This permanently deletes all historical stats, resumes, and logs.</p>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => addNotification("Deactivation request submitted.", "warning")} className="cursor-pointer">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </Card>
        </div>

      </div>
    </PageTransition>
  );
}
