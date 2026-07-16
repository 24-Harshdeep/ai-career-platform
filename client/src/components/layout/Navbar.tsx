"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCareerStore } from "@/store/careerStore";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import {
  Bell,
  Sun,
  Moon,
  Search,
  Check,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
  User,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const storeUser = useCareerStore((state) => state.user);
  const notifications = useCareerStore((state) => state.notifications);
  const markNotificationsRead = useCareerStore((state) => state.markNotificationsRead);
  const fetchNotifications = useCareerStore((state) => state.fetchNotifications);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = storeUser.name || user.name;
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => n && !n.read).length : 0;
  const pathname = usePathname();

  // Scroll main scrollable container to top on navigation/pathname changes
  useEffect(() => {
    const container = document.getElementById("main-scroll-container");
    if (container) {
      container.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname]);

  // Initialize theme from localStorage or system preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      setTheme(systemTheme);
      document.documentElement.setAttribute("data-theme", systemTheme);
    }
  }, []);

  // Theme toggle action with circular view transition support
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";

    if (typeof document !== "undefined" && (document as any).startViewTransition) {
      (document as any).startViewTransition(() => {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      });
    } else {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "streak":
        return <Flame className="w-4 h-4 text-warning" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6 md:px-8">
      {/* Left: Greeting */}
      <div className="flex flex-col justify-center">
        <h1 className="text-base md:text-lg font-bold tracking-tight text-foreground">
          Good Morning, {displayName || "Harshdeep"}
        </h1>
        <p className="text-[11px] text-muted">Your career journey is progressing.</p>
      </div>

      {/* Right: Search, Notifications, Theme, Avatar */}
      <div className="flex items-center space-x-4">
        {/* Search Bar */}
        <div className="hidden sm:flex items-center bg-accent/20 border border-border rounded-xl px-3 py-1.5 w-48 md:w-64 transition-all duration-200 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30">
          <Search className="w-4 h-4 text-muted mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search CareerOS..."
            className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder-muted"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-border bg-card text-muted hover:text-foreground hover:bg-accent/40 transition-colors duration-200 cursor-pointer"
          title="Toggle Theme"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl border border-border bg-card text-muted hover:text-foreground hover:bg-accent/40 transition-colors duration-200 relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-card animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in-up">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markNotificationsRead()}
                    className="text-xs text-primary font-medium hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark all as read</span>
                  </button>
                )}
              </div>

              <div className="max-h-[320px] overflow-y-auto custom-scrollbar divide-y divide-border">
                {!notifications || !Array.isArray(notifications) || notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted">No notifications yet.</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 flex space-x-3 transition-colors duration-200 ${
                        notif.read ? "bg-transparent" : "bg-primary/5"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground font-medium leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-muted mt-1 block">
                          {notif.createdAt}
                        </span>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shadow-md cursor-pointer">
          {displayName ? displayName.slice(0, 2).toUpperCase() : <User className="w-5 h-5" />}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
