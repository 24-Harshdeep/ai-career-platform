"use client";

import React from "react";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const staggerContainer = {
  enter: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  const combinedVariants = {
    initial: pageVariants.initial,
    enter: {
      ...pageVariants.enter,
      ...staggerContainer.enter,
    },
    exit: pageVariants.exit,
  };

  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={combinedVariants}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger child wrapper — use inside PageTransition for staggered card entrance
export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({
  children,
  className,
  id,
}) => {
  return (
    <motion.div
      id={id}
      variants={{
        initial: { opacity: 0, y: 10 },
        enter: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
