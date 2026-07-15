"use client";

import React, { useState } from "react";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { Briefcase, Plus, Search, Calendar, ChevronRight, Check } from "lucide-react";

export default function ApplicationsPage() {
  const applications = useCareerStore((state) => state.applications);
  const addApplication = useCareerStore((state) => state.addApplication);
  const updateApplicationStatus = useCareerStore(
    (state) => state.updateApplicationStatus
  );

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [matchScore, setMatchScore] = useState(85);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    addApplication({
      company,
      role,
      matchScore,
      status: "Applied",
    });

    setCompany("");
    setRole("");
    setShowAddForm(false);
  };

  const getStatusBadge = (status: typeof applications[0]["status"]) => {
    switch (status) {
      case "Offer":
        return <Badge variant="success">Offer</Badge>;
      case "Interview":
        return <Badge variant="warning">Interview</Badge>;
      case "Rejected":
        return <Badge variant="muted">Rejected</Badge>;
      case "Applied":
      default:
        return <Badge variant="info">Applied</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Job Application Tracker</h2>
            <p className="text-xs text-muted">Manage your job pipeline, track interview stages, and review match compatibility.</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="cursor-pointer"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Position</span>
        </Button>
      </div>

      {/* Slide down Add Application form */}
      {showAddForm && (
        <Card className="p-6 border-primary/20 bg-accent/5">
          <form onSubmit={handleAddApp} className="space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
              Add New Job Application
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-card border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Role Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Full Stack Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-card border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Match Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={matchScore}
                  onChange={(e) => setMatchScore(Number(e.target.value))}
                  className="w-full bg-card border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Add Application
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted border border-dashed border-border rounded-2xl bg-card">
            No applications tracked yet. Click "Add Position" to populate.
          </div>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Job Details */}
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-accent/25 border border-border flex items-center justify-center font-bold text-primary shrink-0 text-sm">
                  {app.company.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">{app.role}</h3>
                  <p className="text-xs text-muted font-medium mt-1">{app.company}</p>
                  <div className="flex items-center space-x-3 mt-2 text-[10px] text-muted">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 shrink-0" />
                      <span>Applied: {app.dateApplied}</span>
                    </span>
                    <span className="bg-primary/5 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold">
                      Match: {app.matchScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Pipeline Status Action */}
              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                {/* Current Status */}
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-muted font-bold uppercase hidden md:inline">Status:</span>
                  {getStatusBadge(app.status)}
                </div>

                {/* Pipeline transition trigger buttons */}
                <div className="flex items-center space-x-1">
                  {app.status === "Applied" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-[11px] px-3 py-1.5 cursor-pointer"
                      onClick={() => updateApplicationStatus(app.id, "Interview")}
                    >
                      Promote to Interview
                    </Button>
                  )}
                  {app.status === "Interview" && (
                    <Button
                      variant="ai"
                      size="sm"
                      className="text-[11px] px-3 py-1.5 cursor-pointer"
                      onClick={() => updateApplicationStatus(app.id, "Offer")}
                    >
                      Receive Offer
                    </Button>
                  )}
                  {app.status === "Offer" && (
                    <div className="text-success text-xs font-bold flex items-center px-3 py-1.5 bg-success/15 border border-success/35 rounded-xl">
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Offer Secured</span>
                    </div>
                  )}
                  {app.status !== "Rejected" && app.status !== "Offer" && (
                    <button
                      onClick={() => updateApplicationStatus(app.id, "Rejected")}
                      className="text-[10px] text-muted hover:text-red-500 font-semibold px-2 py-1.5 cursor-pointer"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
