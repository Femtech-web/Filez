import { motion } from "framer-motion";

export function FilePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-48 bg-secondary rounded animate-pulse" />
                <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-24 bg-secondary rounded-lg animate-pulse" />
              <div className="h-10 w-28 bg-secondary rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Preview Card */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="aspect-video bg-secondary animate-pulse" />
                <div className="p-4 border-t border-border">
                  <div className="flex gap-4">
                    <div className="h-5 w-20 bg-secondary rounded animate-pulse" />
                    <div className="h-5 w-24 bg-secondary rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Activity */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="h-6 w-24 bg-secondary rounded animate-pulse mb-4" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                    >
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
                        <div className="h-3 w-24 bg-secondary rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* File Details */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="h-6 w-28 bg-secondary rounded animate-pulse mb-4" />
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                    >
                      <div className="w-9 h-9 rounded-lg bg-secondary animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-12 bg-secondary rounded animate-pulse" />
                        <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* On-Chain */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="h-6 w-24 bg-secondary rounded animate-pulse mb-4" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-secondary rounded animate-pulse" />
                    <div className="h-10 w-full bg-secondary rounded-lg animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-secondary rounded animate-pulse" />
                    <div className="h-10 w-full bg-secondary rounded-lg animate-pulse" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-secondary rounded-full animate-pulse" />
                    <div className="h-6 w-18 bg-secondary rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
