"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const AnimatedInput = React.forwardRef<
  HTMLInputElement,
  AnimatedInputProps
>(({ className, label, error, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="w-full space-y-1.5 sm:space-y-2">
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-foreground break-words"
        >
          {label}
        </motion.label>
      )}

      <motion.div
        animate={{
          scale: isFocused ? 1.015 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="relative w-full"
      >
        <input
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl border-2 bg-card text-foreground transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            "text-sm sm:text-base",
            "break-words",
            isFocused
              ? "border-primary shadow-[0_0_20px_rgba(255,109,31,0.2)]"
              : "border-border",
            error && "border-destructive focus:ring-destructive/50",
            className
          )}
          {...props}
        />

        {isFocused && (
          <motion.div
            layoutId="input-focus"
            className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs sm:text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

AnimatedInput.displayName = "AnimatedInput";
