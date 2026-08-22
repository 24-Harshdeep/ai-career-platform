"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-6", className)}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-primary/8 text-primary rounded-lg shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
};

export default PageHeader;
