"use client";

import { motion } from "framer-motion";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="h-7 w-24 bg-secondary rounded-lg animate-pulse" />
              <div className="h-10 w-48 bg-secondary rounded-lg animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-64 bg-secondary rounded-lg animate-pulse hidden md:block" />
              <div className="h-10 w-24 bg-secondary rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-card border border-border rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 w-12 bg-secondary rounded animate-pulse" />
                  <div className="h-3 w-16 bg-secondary rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* File Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-card border border-border rounded-xl"
            >
              {/* Preview */}
              <div className="aspect-[4/3] rounded-lg bg-secondary mb-4 animate-pulse" />

              {/* Content */}
              <div className="space-y-3">
                <div className="h-5 w-3/4 bg-secondary rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-4 w-16 bg-secondary rounded animate-pulse" />
                  <div className="h-4 w-20 bg-secondary rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-14 bg-secondary rounded-full animate-pulse" />
                  <div className="h-5 w-12 bg-secondary rounded-full animate-pulse" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
