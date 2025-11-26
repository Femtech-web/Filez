import { motion } from "framer-motion";

export function FilePageSkeleton() {
  const Pulse = "animate-pulse bg-secondary/40 rounded-md";

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Back Button Skeleton */}
      <div className="w-32 h-8 mb-6 rounded-md bg-secondary/40 animate-pulse" />

      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`${Pulse} w-8 h-8 rounded-full`} />
              <div className={`${Pulse} h-8 w-64`} />
            </div>
            <div className={`${Pulse} h-4 w-72`} />
          </div>
          <div className={`${Pulse} w-20 h-8 ml-4 rounded-md`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Preview + Timeline) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview Card Skeleton */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className={`${Pulse} rounded-xl w-full aspect-[16/10]`} />

            {/* Action Buttons Skeleton */}
            <div className="flex gap-3">
              <div className={`${Pulse} h-12 flex-1 rounded-lg`} />
              <div className={`${Pulse} h-12 flex-1 rounded-lg`} />
            </div>
          </div>

          {/* Activity Timeline Skeleton */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className={`${Pulse} h-6 w-40 rounded-md`} />

            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                >
                  <div className={`${Pulse} w-2 h-2 rounded-full`} />
                  <div className="flex-1 space-y-2">
                    <div className={`${Pulse} h-4 w-40`} />
                    <div className={`${Pulse} h-3 w-24`} />
                  </div>
                  <div className={`${Pulse} w-4 h-4 rounded-md`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="space-y-6">
          {/* Details Card Skeleton */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className={`${Pulse} h-6 w-32`} />

            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                >
                  <div className={`${Pulse} w-10 h-10 rounded-lg`} />
                  <div className="flex-1 space-y-2">
                    <div className={`${Pulse} w-20 h-3`} />
                    <div className={`${Pulse} w-32 h-4`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* On-Chain Info Skeleton */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className={`${Pulse} h-5 w-48`} />

            <div className="space-y-3">
              <div>
                <div className={`${Pulse} h-3 w-24 mb-2`} />
                <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                  <div className={`${Pulse} h-4 w-full`} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`${Pulse} w-16 h-6 rounded-md`} />
                ))}
              </div>

              <div className={`${Pulse} h-3 w-full mt-3`} />
              <div className={`${Pulse} h-3 w-2/3`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
