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
  GraduationCap,
  LineChart,
  Settings,
  User
} from "lucide-react";

interface NavGroup {
  label: string;
  items: {
    name: string;
    href: string;
    icon: React.ElementType;
  }[];
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const storeUser = useCareerStore((state) => state.user);

  const displayName = storeUser?.name || user?.name || "Candidate Profile";
  const displayGoal = storeUser?.goal || user?.role || "Full Stack Candidate";

  const navGroups: NavGroup[] = [
    {
      label: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      label: "CAREER",
      items: [
        { name: "Career DNA", href: "/dna", icon: Dna },
        { name: "Roadmap", href: "/roadmap", icon: Map },
        { name: "Career Coach", href: "/coach", icon: MessageSquareCode }
      ]
    },
    {
      label: "BUILD",
      items: [
        { name: "Resume Intelligence", href: "/resume", icon: FileText },
        { name: "Portfolio Intelligence", href: "/portfolio", icon: FolderGit }
      ]
    },
    {
      label: "PREPARE",
      items: [
        { name: "Interview Intelligence", href: "/interview", icon: GraduationCap }
      ]
    },
    {
      label: "SYSTEM",
      items: [
        { name: "Settings", href: "/settings", icon: Settings }
      ]
    }
  ];

  // Mobile navigation bar items (4 core targets)
  const mobileNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Career DNA", href: "/dna", icon: Dna },
    { name: "Coach", href: "/coach", icon: MessageSquareCode },
    { name: "Resume", href: "/resume", icon: FileText }
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
        <div className="h-16 border-b border-border flex items-center px-4">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 overflow-hidden relative shrink-0 flex items-center justify-center">
              <img 
                src="/logo1.png" 
                alt="CareerOS Logo" 
                className="w-full h-full object-contain scale-110 transition-transform group-hover:scale-120"
              />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
              CareerOS
            </span>
          </Link>
        </div>

        {/* Grouped Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] font-semibold text-muted tracking-wider uppercase px-3 mb-1.5">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150 group cursor-pointer",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary"
                          : "text-muted hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-muted group-hover:text-foreground"
                        )}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User profile card */}
        <div className="p-3 border-t border-border bg-accent/20">
          <div className="flex items-center space-x-3 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {displayName ? getInitials(displayName) : <User className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground leading-snug">
                {displayName}
              </p>
              <p className="text-[10px] text-muted truncate leading-snug">{displayGoal}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t border-border z-50 flex items-center justify-around px-2 shadow-lg">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors duration-150",
                isActive ? "text-primary font-semibold" : "text-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 mb-0.5 transition-transform duration-150",
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
