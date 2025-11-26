"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatedCard } from "@/components/animated-card";
import { AnimatedButton } from "@/components/animated-button";
import { AnimatedBadge } from "@/components/animated-badge";
import { UploadModal } from "@/components/upload-modal";
import { WalletGuard } from "@/components/wallet-guard";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Upload, Lock, ExternalLink, Shield, Database } from "lucide-react";
import { useFilezSubgraph } from "@/hooks/useFilezSubgraph";
import { DashboardSkeleton } from "@/components/skeleton/dashboardSkeleton";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") || "my-files";
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { myFiles, sharedWithMe, loading, page, setPage, hasMore } =
    useFilezSubgraph();

  const files = tab === "shared" ? sharedWithMe : myFiles;

  if (loading && page === 0) return <DashboardSkeleton />;

  return (
    <WalletGuard>
      <div className="min-h-screen bg-background p-4 sm:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                {tab === "shared" ? "Shared With Me" : "My Files"}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {tab === "shared"
                  ? "Files that others have shared with you"
                  : "Your encrypted files stored on-chain"}
              </p>
            </div>

            {/* Upload Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full sm:w-auto"
            >
              <AnimatedButton
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Upload className="w-5 h-5" />
                Upload File
              </AnimatedButton>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-border pb-1">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ y: -2 }}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors relative whitespace-nowrap ${
                  tab !== "shared"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Files
                {tab !== "shared" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            </Link>

            <Link href="/dashboard?tab=shared">
              <motion.button
                whileHover={{ y: -2 }}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors relative whitespace-nowrap ${
                  tab === "shared"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Shared With Me
                {tab === "shared" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* File Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {files.map((file: any, index: number) => {
            const Icon = file.icon;
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={
                    tab === "shared"
                      ? `/file/${file.fileId}`
                      : `/file/${file.id}`
                  }
                >
                  <AnimatedCard hover className="group cursor-pointer p-4">
                    {/* Preview */}
                    <div className="relative h-36 sm:h-48 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 mb-3 sm:mb-4 overflow-hidden">
                      <motion.div
                        className="absolute inset-0 backdrop-blur-3xl bg-primary/5"
                        animate={{
                          backgroundPosition: ["0% 0%", "100% 100%"],
                        }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                      />

                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                          }}
                          className="p-4 sm:p-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-border"
                        >
                          <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
                        </motion.div>
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="relative">
                        <h3 className="font-semibold text-foreground truncate text-base sm:text-lg blur-sm group-hover:blur-none transition-all">
                          {file.name}
                        </h3>
                        <div className="absolute inset-0 flex items-center gap-1 group-hover:opacity-0 transition-opacity">
                          <Lock className="w-3 h-3 text-primary" />
                          <span className="text-xs text-muted-foreground">
                            Encrypted filename
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{file.uploadedAt}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                        <Database className="w-3 h-3 text-muted-foreground" />
                        <code className="text-muted-foreground font-mono truncate">
                          {file.cid}
                        </code>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </div>

                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <AnimatedBadge variant="default">
                          <Lock className="w-3 h-3" />
                          Encrypted
                        </AnimatedBadge>

                        <AnimatedBadge variant="default">
                          <Shield className="w-3 h-3" />
                          On-chain
                        </AnimatedBadge>

                        {tab === "shared" && (
                          <AnimatedBadge variant="default">
                            Private
                          </AnimatedBadge>
                        )}
                      </div>

                      {tab === "shared" && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          Shared by <code>{file?.owner}</code>
                        </p>
                      )}
                    </div>
                  </AnimatedCard>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-8 sm:mt-10">
          {hasMore ? (
            <AnimatedButton
              variant="outline"
              onClick={() => setPage(page + 1)}
              className="text-sm sm:text-base"
            >
              Load More
            </AnimatedButton>
          ) : (
            <p className="text-muted-foreground text-xs sm:text-sm">
              No more files
            </p>
          )}
        </div>

        {/* Upload Modal */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      </div>
    </WalletGuard>
  );
}
