"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ButtonProps } from "./button.types";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

    const variants = {
      primary: "bg-primary text-white hover:bg-primary/90 focus:ring-primary/50 shadow-sm border border-primary/20",
      secondary: "bg-card text-foreground border border-border hover:bg-accent hover:text-foreground focus:ring-accent",
      ghost: "text-muted hover:bg-accent hover:text-foreground focus:ring-accent",
      danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50 shadow-sm border border-red-600/20",
      ai: "bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 focus:ring-primary/50 shadow-sm border border-primary/20",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-4.5 py-2.5 text-sm",
      lg: "px-6 py-3.5 text-base rounded-2xl",
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.015 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.985 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...(props as any)}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin -ml-1 mr-2 h-4.5 w-4.5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
