"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CardProps } from "./card.types";

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "dashboard", hoverEffect = true, children, ...props }, ref) => {
    const baseStyles = "rounded-xl border transition-colors duration-200";

    const variants = {
      dashboard: "bg-card text-card-foreground border-border shadow-xs p-6",
      metric: "bg-card text-card-foreground border-border shadow-xs p-5 flex flex-col justify-between",
      glass: "glass-effect shadow-sm p-6",
      insight: "bg-card text-card-foreground border-border border-l-2 border-l-primary shadow-xs p-6 relative overflow-hidden",
    };

    return (
      <motion.div
        ref={ref}
        whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2 } } : undefined}
        className={cn(baseStyles, variants[variant], className)}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-base font-semibold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-muted leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4 border-t border-border mt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export default Card;
