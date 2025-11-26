"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error"
  children: React.ReactNode
}

export const AnimatedBadge = React.forwardRef<HTMLDivElement, AnimatedBadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-primary/20 text-primary border-primary/30",
      success: "bg-green-500/20 text-green-600 border-green-500/30",
      warning: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
      error: "bg-red-500/20 text-red-600 border-red-500/30"
    }

    return (
      <motion.div
        ref={ref}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all duration-300",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedBadge.displayName = "AnimatedBadge"
