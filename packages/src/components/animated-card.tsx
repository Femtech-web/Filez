"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
}

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, hover = true, glow = false, ...props }, ref) => {
    return (
      // @ts-expect-error - framer-motion drag event type conflict
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={
          hover
            ? {
                y: -3,
                transition: { duration: 0.2 },
              }
            : {}
        }
        className={cn(
          "relative rounded-2xl bg-card border-2 border-border shadow-lg backdrop-blur-sm transition-all duration-300",
          "p-4 sm:p-6 w-full overflow-hidden",
          glow && "hover:shadow-[0_0_30px_rgba(255,109,31,0.3)]",
          className
        )}
        {...props}
      >
        {glow && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          />
        )}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";
