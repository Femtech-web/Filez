"use client";

import { ActivityTimeline } from "@/components/activity-timeline";
import { WalletGuard } from "@/components/wallet-guard";
import { useUserActivity, useGlobalStats } from "@/hooks/useFilezSubgraph";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  TrendingUp,
  Users,
  FileText,
  Share2,
  ShieldOff,
  Loader2,
} from "lucide-react";

export default function ActivityPage() {
  const { address } = useAccount();
  const { events, loading, page, setPage, hasMore } = useUserActivity(10);
  const { stats, loading: statsLoading } = useGlobalStats();

  return (
    <WalletGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Title & Tabs */}
              <div className="flex items-center gap-6">
                <h1 className="text-xl font-semibold text-foreground hidden sm:block">
                  Activity Timeline
                </h1>

                {/* Tabs */}
                <div className="flex items-center bg-secondary rounded-lg p-1">
                  <Link href="/dashboard">
                    <button
                      className="px-4 py-2 text-sm font-medium rounded-md transition-all text-muted-foreground hover:text-foreground"
                    >
                      My Files
                    </button>
                  </Link>
                  <Link href="/dashboard?tab=shared">
                    <button
                      className="px-4 py-2 text-sm font-medium rounded-md transition-all text-muted-foreground hover:text-foreground"
                    >
                      Shared
                    </button>
                  </Link>
                  <Link href="/dashboard/activity">
                    <button
                      className="px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 bg-card text-foreground shadow-sm"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Activity
                    </button>
                  </Link>
                </div>
              </div>

              {/* Description - visible on mobile */}
              <p className="text-sm text-muted-foreground sm:hidden">
                Complete history
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Main Timeline */}
              <div className="lg:col-span-3 order-2 lg:order-1">
                <ActivityTimeline
                  events={events}
                  currentUserAddress={address}
                  isLoading={loading && page === 0}
                  showFilters={true}
                  onLoadMore={hasMore ? () => setPage(page + 1) : undefined}
                  hasMore={hasMore}
                />
              </div>

              {/* Sidebar Stats */}
              <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
                {/* Global Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Platform Stats
                  </h2>

                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : stats ? (
                    <div className="space-y-4">
                      {[
                        {
                          icon: FileText,
                          label: "Total Files",
                          value: stats.totalFiles?.toString() || "0",
                          active: stats.activeFiles?.toString() || "0",
                        },
                        {
                          icon: Share2,
                          label: "Total Shares",
                          value: stats.totalShares?.toString() || "0",
                          active: stats.activeShares?.toString() || "0",
                        },
                        {
                          icon: ShieldOff,
                          label: "Revocations",
                          value: stats.totalRevocations?.toString() || "0",
                        },
                        {
                          icon: Users,
                          label: "Total Users",
                          value: stats.totalUsers?.toString() || "0",
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="p-3 bg-secondary/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <stat.icon className="w-4 h-4 text-primary" />
                            <p className="text-xs text-muted-foreground">
                              {stat.label}
                            </p>
                          </div>
                          <p className="text-2xl font-semibold text-foreground">
                            {stat.value}
                          </p>
                          {stat.active && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {stat.active} active
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Stats unavailable
                    </p>
                  )}
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Quick Info
                  </h2>

                  <div className="space-y-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm text-foreground font-medium mb-1">
                        Activity Events
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Track all file operations including uploads, shares,
                        access, and revocations
                      </p>
                    </div>

                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-foreground font-medium mb-1">
                        Real-time Updates
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Events are indexed by The Graph subgraph and update
                        automatically
                      </p>
                    </div>

                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-foreground font-medium mb-1">
                        Audit Trail
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Complete on-chain history with transaction hashes for
                        verification
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </WalletGuard>
  );
}
