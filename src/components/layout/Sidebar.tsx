"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCareerStore } from "@/store/careerStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Dna,
  Map,
  MessageSquareCode,
  FileText,
  FolderGit,
  Briefcase,
  GraduationCap,
  LineChart,
  Settings,
  User,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const storeUser = useCareerStore((state) => state.user);

  const displayName = storeUser.name || user.name;
  const displayGoal = storeUser.goal || user.role;

  // New refined 10-item list (structured logically)
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Career DNA", href: "/dna", icon: Dna },
    { name: "Roadmap", href: "/roadmap", icon: Map },
    { name: "Career Coach", href: "/coach", icon: MessageSquareCode },
    { name: "Resume Intelligence", href: "/resume", icon: FileText },
    { name: "Portfolio Intelligence", href: "/portfolio", icon: FolderGit },
    { name: "Job Applications", href: "/applications", icon: Briefcase },
    { name: "Interview Prep", href: "/interview", icon: GraduationCap },
    { name: "Career Analytics", href: "/analytics", icon: LineChart },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Mobile navigation bar items (top 5 essential targets)
  const mobileNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Career DNA", href: "/dna", icon: Dna },
    { name: "Career Coach", href: "/coach", icon: MessageSquareCode },
    { name: "Resume", href: "/resume", icon: FileText },
    { name: "Applications", href: "/applications", icon: Briefcase },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] h-screen bg-card text-foreground border-r border-border shrink-0 sticky top-0">
        {/* Header/Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="flex flex-col group">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:opacity-90">
              CareerOS
            </span>
            <span className="text-[10px] text-muted tracking-wider uppercase font-semibold mt-0.5">
              AI Career Intelligence
            </span>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-primary text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)] border border-primary/20"
                    : "text-muted hover:text-foreground hover:bg-accent/40"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105",
                    isActive ? "text-white" : "text-muted group-hover:text-foreground"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile card */}
        <div className="p-4 border-t border-border bg-accent/20">
          <div className="flex items-center space-x-3 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shadow-md">
              {displayName ? getInitials(displayName) : <User className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">
                {displayName || "Harshdeep"}
              </p>
              <p className="text-[11px] text-muted truncate">{displayGoal}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-lg border-t border-border z-50 flex items-center justify-around px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors duration-200",
                isActive ? "text-primary" : "text-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5.5 h-5.5 mb-0.5 transition-transform duration-200",
                  isActive ? "text-primary scale-105" : "text-muted"
                )}
              />
              <span className="truncate max-w-[70px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16 w-full shrink-0" />
    </>
  );
};

export default Sidebar;
