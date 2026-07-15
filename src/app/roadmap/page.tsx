"use client";

import React, { useState } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import { Map, ShieldCheck, CheckCircle2, Circle, Clock, Award } from "lucide-react";

export default function RoadmapPage() {
  const storeRoadmap = useCareerStore((state) => state.roadmap);
  const addNotification = useCareerStore((state) => state.addNotification);
  const updateScore = useCareerStore((state) => state.updateScore);

  const initialSubskills: Record<string, { name: string; checked: boolean }[]> = {
    "rm-1": [
      { name: "HTML5 Semantic Architecture", checked: true },
      { name: "CSS3 Flexbox, Grid & Subgrid", checked: true },
      { name: "Modern React (v19 hooks, server actions)", checked: true },
      { name: "TypeScript Strict Type Safety", checked: true },
      { name: "Next.js App Router Optimization", checked: true },
      { name: "INP & Core Web Vitals Optimization", checked: false },
    ],
    "rm-2": [
      { name: "Node.js Event Loop & Express API Design", checked: true },
      { name: "SQL Schema Design & Joins (PostgreSQL)", checked: true },
      { name: "JSON Web Token (JWT) Lifecycle Authentication", checked: false },
      { name: "RESTful API Security Headers & CORS", checked: false },
      { name: "Database Migrations & Transaction Guards", checked: false },
    ],
    "rm-3": [
      { name: "Caching Layers (Redis integration)", checked: true },
      { name: "Load Balancing (Nginx, round robin)", checked: false },
      { name: "Microservices Communication (gRPC/Queues)", checked: false },
      { name: "Database Sharding & Read-Replicas", checked: false },
    ],
  };

  const [subskills, setSubskills] = useState(initialSubskills);

  const toggleSubskill = (moduleId: string, index: number, name: string) => {
    const updated = { ...subskills };
    const currentStatus = updated[moduleId][index].checked;
    updated[moduleId][index].checked = !currentStatus;
    setSubskills(updated);

    if (!currentStatus) {
      updateScore(1);
      addNotification(`Skill checked: ${name}! Career Score +1.`, "success");
    } else {
      updateScore(-1);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
          <Map className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Interactive Learning Roadmap</h2>
          <p className="text-xs text-muted">Core milestones, technical checkpoints, and skill trackers tailored to your career goal.</p>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {storeRoadmap.map((module) => (
          <Card key={module.id} className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4 mb-5">
              {/* Header */}
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">{module.title}</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Focus Module</span>
                  <Badge variant={module.progress >= 80 ? "success" : "warning"}>
                    {module.progress}% Complete
                  </Badge>
                </div>
              </div>

              {/* Progress Bar Display */}
              <div className="w-full md:w-64 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-muted">
                  <span>Track Progress</span>
                  <span>{module.progress}%</span>
                </div>
                <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Checklists grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subskills[module.id]?.map((sub, index) => (
                <button
                  key={sub.name}
                  onClick={() => toggleSubskill(module.id, index, sub.name)}
                  className="flex items-start space-x-3 p-3 rounded-xl border border-border bg-accent/5 hover:bg-accent/15 transition-all text-left group cursor-pointer"
                >
                  {sub.checked ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted group-hover:text-primary shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <span
                      className={`text-xs font-semibold text-foreground ${
                        sub.checked ? "line-through text-muted" : ""
                      }`}
                    >
                      {sub.name}
                    </span>
                    <p className="text-[9px] text-muted">
                      {sub.checked ? "Milestone verified" : "Click to mark complete (+1 point)"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
