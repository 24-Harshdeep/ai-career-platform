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
export default Card;
