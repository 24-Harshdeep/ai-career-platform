"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import {
  Dna,
  Target,
  ShieldCheck,
  UserCheck,
  Search,
  SlidersHorizontal,
  AlertTriangle
} from "lucide-react";

export default function CareerDnaPage() {
  const storeUser = useCareerStore((state) => state.user);
  const profile = useCareerStore((state) => state.profile);
  const updateGoal = useCareerStore((state) => state.updateGoal);
  const updateExperience = useCareerStore((state) => state.updateExperience);
  const toggleSkill = useCareerStore((state) => state.toggleSkill);
  const fetchDashboardData = useCareerStore((state) => state.fetchDashboardData);
  const addNotification = useCareerStore((state) => state.addNotification);

  const [goalInput, setGoalInput] = useState(storeUser?.goal || "Full Stack Developer");
  const [experienceInput, setExperienceInput] = useState<any>(
    storeUser?.experience || "Intermediate"
  );
  const [saving, setSaving] = useState(false);

  // Search, filter, and sorting states for skills inventory
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Verified">("All");
  const [sortOrder, setSortOrder] = useState<"name" | "category">("name");

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Synchronize state when storeUser data is asynchronously loaded from the database
  useEffect(() => {
    if (storeUser?.goal) {
      setGoalInput(storeUser.goal);
    }
    if (storeUser?.experience) {
      setExperienceInput(storeUser.experience);
    }
  }, [storeUser?.goal, storeUser?.experience]);

  // Aggregate possessed skills from profile
  const possessedSkills = useMemo(() => {
    if (!profile?.skillsPossessed) return [];
    
    // We flatten the object into an array of { name, category }
    const skills: { name: string; category: string }[] = [];
    for (const [category, skillList] of Object.entries(profile.skillsPossessed)) {
      if (Array.isArray(skillList)) {
        skillList.forEach(name => skills.push({ name, category }));
      }
    }
    return skills;
  }, [profile]);
  
  // Create a combined list of possessed and a basic catalog of typical skills for this role
  const allSkillsList = useMemo(() => {
    // Basic catalog to show something if user has nothing
    const catalog = [
      { name: "React", category: "frontend" },
      { name: "Node.js", category: "backend" },
      { name: "TypeScript", category: "languages" },
      { name: "Python", category: "languages" },
      { name: "AWS", category: "cloud" },
      { name: "Docker", category: "devops" },
      { name: "SQL", category: "database" },
      { name: "MongoDB", category: "database" },
      { name: "GraphQL", category: "api" },
      { name: "Next.js", category: "frontend" }
    ];
    
    const combined = [...possessedSkills];
    
    // Add catalog items that aren't already possessed
    catalog.forEach(item => {
      if (!combined.some(s => s.name.toLowerCase() === item.name.toLowerCase())) {
        combined.push(item);
      }
    });
    
    return combined;
  }, [possessedSkills]);

  // Handle Save Profile
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateGoal(goalInput);
      await updateExperience(experienceInput);
      addNotification("Career DNA profile saved successfully!", "success");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSkill = async (skillName: string, category: string) => {
    await toggleSkill(skillName);
    addNotification(`Skill inventory updated: toggled "${skillName}"`, "info");
  };

  // Filtered & Sorted skills calculations
  const processedSkillsList = useMemo(() => {
    let list = allSkillsList.map(skill => ({
      ...skill,
      isPossessed: possessedSkills.some(ps => ps.name === skill.name)
    }));

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }

    // Segment tab filter
    if (activeTab === "Verified") {
      list = list.filter(s => s.isPossessed);
    }

    // Sort ordering
    list.sort((a, b) => {
      if (sortOrder === "category") {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [allSkillsList, possessedSkills, searchQuery, activeTab, sortOrder]);

  return (
    <PageTransition className="space-y-6 pb-12">
      <StaggerItem>
        <PageHeader 
          icon={Dna} 
          title="Career DNA" 
          description="Your core career identity, skills, and goals. Update this to tune your AI recommendations."
        />
      </StaggerItem>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <StaggerItem>
            <Card className="p-6">
              <div className="flex items-center space-x-2 border-b border-border pb-4 mb-4">
                <UserCheck className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Identity & Goal</h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wide">Target Role</label>
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="w-full bg-accent border border-border outline-none rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wide">Experience Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setExperienceInput(level)}
                        className={`py-2 text-[10px] font-bold border rounded-lg transition-colors ${
                          experienceInput === level
                            ? "bg-primary text-white border-primary"
                            : "bg-card border-border text-muted hover:text-foreground hover:bg-accent"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full mt-2"
                  onClick={handleSaveProfile}
                  isLoading={saving}
                >
                  Save Identity
                </Button>
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="p-6">
              <div className="flex items-center space-x-2 border-b border-border pb-4 mb-4">
                <ShieldCheck className="w-5 h-5 text-success" />
                <h3 className="text-sm font-semibold text-foreground">Core Strengths</h3>
              </div>
              <div className="space-y-3">
                {profile?.strengths && profile.strengths.length > 0 ? (
                  profile.strengths.map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-sm font-medium">
                      <span>{s}</span>
                      <Badge variant="success">Strength</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted">No strengths identified yet. Sync your GitHub or upload a resume.</p>
                )}
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="p-6">
              <div className="flex items-center space-x-2 border-b border-border pb-4 mb-4">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h3 className="text-sm font-semibold text-foreground">Growth Areas</h3>
              </div>
              <div className="space-y-3">
                {profile?.weaknesses && profile.weaknesses.length > 0 ? (
                  profile.weaknesses.map((w, i) => (
                    <div key={i} className="flex justify-between items-center text-sm font-medium">
                      <span>{w}</span>
                      <Badge variant="warning">Focus</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted">No growth areas identified yet.</p>
                )}
              </div>
            </Card>
          </StaggerItem>
        </div>

        {/* Right Column (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <StaggerItem>
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4 mb-5">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Skills Inventory</h3>
                  </div>
                </div>
                <div className="flex bg-accent rounded-lg p-1">
                  {(["All", "Verified"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-accent border border-border outline-none rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:border-primary/50"
                  />
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <SlidersHorizontal className="w-4 h-4 text-muted" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="bg-accent border border-border outline-none rounded-lg px-2 py-2 text-sm text-foreground"
                  >
                    <option value="name">Name A-Z</option>
                    <option value="category">Category</option>
                  </select>
                </div>
              </div>

              {processedSkillsList.length === 0 ? (
                <EmptyState 
                  title="No skills found" 
                  description="Try adjusting your search or add skills by uploading your resume." 
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {processedSkillsList.map((skill, i) => (
                    <div 
                      key={`${skill.name}-${i}`}
                      onClick={() => handleToggleSkill(skill.name, skill.category)}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer flex items-center justify-between ${
                        skill.isPossessed 
                          ? "bg-primary/5 border-primary/20 hover:bg-primary/10" 
                          : "bg-card border-border hover:bg-accent"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-foreground">{skill.name}</div>
                        <div className="text-[10px] text-muted font-medium uppercase mt-0.5">{skill.category}</div>
                      </div>
                      <div>
                        {skill.isPossessed ? (
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </StaggerItem>
        </div>
      </div>
    </PageTransition>
  );
}
