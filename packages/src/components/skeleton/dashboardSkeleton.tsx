"use client";

import { motion } from "framer-motion";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="space-y-3">
            {/* Title Skeleton */}
            <div className="h-8 w-48 rounded-md bg-secondary animate-pulse" />
            <div className="h-4 w-80 rounded-md bg-secondary/80 animate-pulse" />
          </div>

          {/* Button Skeleton */}
          <div className="h-11 w-36 bg-secondary rounded-xl animate-pulse" />
        </motion.div>

        {/* Tabs Skeleton */}
        <div className="flex gap-4 border-b border-border pb-3">
          <div className="h-6 w-24 bg-secondary rounded-md animate-pulse" />
          <div className="h-6 w-32 bg-secondary rounded-md animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border p-4 bg-card"
          >
            {/* Preview Box */}
            <div className="relative h-48 mb-4 rounded-xl overflow-hidden bg-secondary animate-pulse" />

            <div className="space-y-4">
              {/* Title */}
              <div className="h-5 w-40 bg-secondary animate-pulse rounded-md" />

              {/* Metadata Row */}
              <div className="flex gap-2">
                <div className="h-3 w-16 bg-secondary/80 animate-pulse rounded-md" />
                <div className="h-3 w-3 bg-secondary/70 animate-pulse rounded-full" />
                <div className="h-3 w-24 bg-secondary/80 animate-pulse rounded-md" />
              </div>

              {/* CID */}
              <div className="h-3 w-48 bg-secondary/70 animate-pulse rounded-md" />

              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                <div className="h-5 w-20 bg-secondary/70 animate-pulse rounded-md" />
                <div className="h-5 w-20 bg-secondary/70 animate-pulse rounded-md" />
                <div className="h-5 w-16 bg-secondary/70 animate-pulse rounded-md" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
