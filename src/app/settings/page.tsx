"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCareerStore } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { Settings, User, Key, Bell, Shield, LogOut, UserCheck } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut, switchUser, isAuthenticated } = useAuth();
  const storeUser = useCareerStore((state) => state.user);
  const addNotification = useCareerStore((state) => state.addNotification);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    addNotification(
      `Push notifications ${!notificationsEnabled ? "enabled" : "disabled"}.`,
      "info"
    );
  };

  const handleMockSignOut = async () => {
    await signOut();
    addNotification("Logged out successfully.", "info");
  };

  const handleSwitchRole = (role: string, name: string) => {
    switchUser(role, name);
    addNotification(`Switched user profile to ${name} (${role}).`, "success");
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Account Settings</h2>
          <p className="text-xs text-muted">Manage profile details, system preferences, and session security.</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sessions & Auth */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Session info */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Authentication Session</h3>
            </div>

            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-success/5 border border-success/20 rounded-xl">
                  <UserCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-success">Mock Session Active</span>
                    <p className="text-[10px] text-muted">
                      Authenticated as <span className="font-semibold">{storeUser.name || user.name}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-1 bg-accent/10 border border-border p-3.5 rounded-xl text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-muted">Username</span>
                    <span className="text-foreground font-semibold">{storeUser.name || user.name}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted">Target Goal</span>
                    <span className="text-foreground font-semibold">{storeUser.goal || user.role}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted">Session Provider</span>
                    <span className="text-foreground font-semibold">next-auth (Mock)</span>
                  </div>
                </div>

                <Button
                  variant="danger"
                  className="w-full text-xs font-semibold flex items-center justify-center cursor-pointer"
                  onClick={handleMockSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Mock Sign Out</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-center py-4">
                <p className="text-xs text-muted">You are currently signed out of the mockup session.</p>
                <Button
                  variant="primary"
                  className="w-full text-xs font-semibold cursor-pointer"
                  onClick={() => switchUser("Full Stack Developer", "Harshdeep")}
                >
                  Mock Sign In
                </Button>
              </div>
            )}
          </Card>

          {/* User Switcher (For prototype testing) */}
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
              Prototype Persona Switcher
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Quickly test the platform under different career paths and levels to see the AI Career Intelligence adapt.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleSwitchRole("Full Stack Developer", "Harshdeep")}
                className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-accent/20 transition-all text-xs font-semibold flex items-center justify-between cursor-pointer"
              >
                <span>Harshdeep (Full Stack Developer)</span>
                <Badge variant="primary">Active</Badge>
              </button>
              <button
                onClick={() => handleSwitchRole("Backend Architect", "Karanpreet")}
                className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-accent/20 transition-all text-xs font-semibold flex items-center justify-between cursor-pointer"
              >
                <span>Karanpreet (Backend Architect)</span>
                <Badge variant="muted">Switch</Badge>
              </button>
              <button
                onClick={() => handleSwitchRole("DevOps Specialist", "Amritpal")}
                className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-accent/20 transition-all text-xs font-semibold flex items-center justify-between cursor-pointer"
              >
                <span>Amritpal (DevOps Specialist)</span>
                <Badge variant="muted">Switch</Badge>
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Preferences form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Platform Alerts & Digests</h3>
            </div>

            <div className="space-y-4">
              {/* Push alerts */}
              <div className="flex items-center justify-between p-3.5 bg-accent/10 border border-border rounded-xl">
                <div className="space-y-1.5 pr-4">
                  <span className="text-xs font-bold text-foreground">AI Career Score Alerts</span>
                  <p className="text-[10px] text-muted leading-relaxed">
                    Receive instant browser notifications when new missions are generated or score increases.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={handleToggleNotifications}
                  className="w-8.5 h-4 bg-gray-200 rounded-full appearance-none cursor-pointer relative checked:bg-primary before:content-[''] before:absolute before:h-3 before:w-3 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-all checked:before:left-5"
                />
              </div>

              {/* Weekly digests */}
              <div className="flex items-center justify-between p-3.5 bg-accent/10 border border-border rounded-xl">
                <div className="space-y-1.5 pr-4">
                  <span className="text-xs font-bold text-foreground">Weekly Performance Digest</span>
                  <p className="text-[10px] text-muted leading-relaxed">
                    Get email reports of your weekly score growth, study consistency, and interview preparation feedback.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={() => setWeeklyDigest(!weeklyDigest)}
                  className="w-8.5 h-4 bg-gray-200 rounded-full appearance-none cursor-pointer relative checked:bg-primary before:content-[''] before:absolute before:h-3 before:w-3 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-all checked:before:left-5"
                />
              </div>
            </div>
          </Card>

          {/* Security details (mock placeholder) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Security Credentials</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              CareerOS uses mock tokens for sandbox authentication. Real Clerk / OAuth sessions can be enabled by linking API credentials in the environment variables.
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" disabled>
                Configure Clerk OAuth
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
