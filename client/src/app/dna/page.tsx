"use client";

import React, { useState, useEffect } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { Dna, Target, Sparkles, AlertTriangle, ShieldCheck, UserCheck } from "lucide-react";

export default function CareerDnaPage() {
  const storeUser = useCareerStore((state) => state.user);
  const updateGoal = useCareerStore((state) => state.updateGoal);
  const updateExperience = useCareerStore((state) => state.updateExperience);
  const addNotification = useCareerStore((state) => state.addNotification);

  const [goalInput, setGoalInput] = useState(storeUser.goal || "Full Stack Developer");
  const [experienceInput, setExperienceInput] = useState<typeof storeUser.experience>(
    storeUser.experience || "Intermediate"
  );
  const [saving, setSaving] = useState(false);

  // Synchronize state when storeUser data is asynchronously loaded from the database
  useEffect(() => {
    if (storeUser.goal) {
      setGoalInput(storeUser.goal);
    }
    if (storeUser.experience) {
      setExperienceInput(storeUser.experience);
    }
  }, [storeUser.goal, storeUser.experience]);

  const strengths = [
    { name: "React & Next.js", level: "Expert", progress: 95 },
    { name: "Tailwind CSS", level: "Advanced", progress: 90 },
    { name: "TypeScript", level: "Intermediate", progress: 75 },
    { name: "REST API Integration", level: "Intermediate", progress: 70 },
  ];

  const weaknesses = [
    { name: "System Design", level: "Needs Improvement", progress: 30 },
    { name: "Unit & E2E Testing", level: "Needs Improvement", progress: 25 },
    { name: "AWS & Cloud Deployment", level: "Beginner", progress: 20 },
    { name: "Docker Containerization", level: "Beginner", progress: 15 },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600)); // Latency
    updateGoal(goalInput);
    updateExperience(experienceInput);
    addNotification("Career DNA profile saved successfully!", "success");
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
          <Dna className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Career DNA Profile</h2>
          <p className="text-xs text-muted">Your professional identity, strengths, and target milestones.</p>
        </div>
      </div>

      {/* Profile configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <UserCheck className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Identity & Target Role</h3>
            </div>

            <div className="space-y-4">
              {/* Target Goal Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase">Target Goal / Role</label>
                <select
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-full bg-accent/15 border border-border outline-none rounded-xl px-3 py-2.5 text-xs text-foreground cursor-pointer focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                >
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Backend Architect">Backend Architect</option>
                  <option value="Frontend Lead">Frontend Lead</option>
                  <option value="DevOps Specialist">DevOps Specialist</option>
                </select>
              </div>

              {/* Experience selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase">Experience Bracket</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setExperienceInput(level)}
                      className={`py-2 text-[11px] font-bold border rounded-xl cursor-pointer transition-colors duration-200 ${
                        experienceInput === level
                          ? "bg-primary text-white border-primary"
                          : "bg-accent/10 border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full text-xs font-semibold"
                  onClick={handleSaveProfile}
                  isLoading={saving}
                >
                  Save Profile Identity
                </Button>
              </div>
            </div>
          </Card>

          {/* AI insights panel */}
          <Card variant="insight" className="p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-xs text-primary font-bold uppercase tracking-wider">AI Skill Advice</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed font-medium">
              Based on your target goal as a <span className="font-semibold">{storeUser.goal}</span>,
              acquiring Docker skills next will increase your job description matching score from 76% to 81%.
            </p>
          </Card>

          {/* Merged Skills Profile Inventory */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Skills Profile Inventory</h3>
            </div>
            <p className="text-xs text-muted mb-4 leading-relaxed">
              Verify your active technical competencies. Toggling skills updates your Career DNA profile index.
            </p>
            <div className="flex flex-wrap gap-2">
              {["React", "Next.js", "Tailwind CSS", "Node.js", "SQL", "Redis", "Git", "Testing", "Docker", "AWS"].map((skill) => {
                const isPossessed = ["React", "Next.js", "Tailwind CSS", "Node.js", "SQL", "Redis", "Git"].includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() =>
                      addNotification(`Skill inventory updated: toggled "${skill}"`, "info")
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                      isPossessed
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-accent/5 border-border text-muted hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Strengths & Weaknesses meters */}
        <div className="lg:col-span-7 space-y-6">
          {/* Strengths */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-success" />
              <h3 className="text-sm font-semibold text-foreground">Core Strengths</h3>
            </div>
            <div className="space-y-4">
              {strengths.map((s) => (
                <div key={s.name} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-foreground">{s.name}</span>
                    <Badge variant="success">{s.level}</Badge>
                  </div>
                  <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full"
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Weak Areas */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Opportunities / Weak Areas</h3>
            </div>
            <div className="space-y-4">
              {weaknesses.map((w) => (
                <div key={w.name} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-foreground">{w.name}</span>
                    <Badge variant="warning">{w.level}</Badge>
                  </div>
                  <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-warning rounded-full"
                      style={{ width: `${w.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
