"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(
  (
    { className, variant = ",primary", size = "md", children, ...props },
    ref
  ) => {
    const variants = {
      primary:
        "bg-primary text-primary-foreground hover:shadow-[0_0_30px_rgba(255,109,31,0.4)] border-2 border-primary",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-secondary",
      outline:
        "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
      ghost:
        "hover:bg-primary/10 text-foreground border-2 border-transparent hover:border-primary/20",
    };

    const sizes = {
      sm: "px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm",
      md: "px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base",
      lg: "px-5 py-3 sm:px-8 sm:py-4 text-base sm:text-lg",
    };

    return (
      // @ts-expect-error - framer-motion drag event type conflict
      <motion.button
        ref={ref}
        whileHover={{
          scale: 1.05,
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative overflow-hidden rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto",
          // @ts-expect-error - framer-motion drag event type conflict
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6 }}
        />
        <span className="relative z-10 flex items-center justify-center gap-2 flex-wrap text-center">
          {children}
        </span>
      </motion.button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";
