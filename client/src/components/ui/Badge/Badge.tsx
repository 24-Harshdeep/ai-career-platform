import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "info" | "muted" | "primary" | "ai";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "info",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.75 text-xs font-semibold rounded-full border transition-colors duration-200";

  const variants = {
    primary:
      "bg-primary/10 text-primary border-primary/20",
    success:
      "bg-success/10 text-success border-success/20",
    warning:
      "bg-warning/10 text-warning border-warning/20",
    info:
      "bg-sky-500/10 text-sky-500 border-sky-500/20",
    muted:
      "bg-muted/10 text-muted border-muted/20",
    ai:
      "bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-primary/15",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};

export default Badge;
