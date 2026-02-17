"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Upload,
  Lock,
  Shield,
  FileText,
  Grid3X3,
  List,
  Search,
  Plus,
  User,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useFilezSubgraph } from "@/hooks/useFilezSubgraph";
import { UploadModal } from "@/components/upload-modal";
import { WalletGuard } from "@/components/wallet-guard";
import { DashboardSkeleton } from "@/components/skeleton/dashboardSkeleton";
import { FileGrid } from "@/components/dashboard/file-grid";
import { FileList } from "@/components/dashboard/file-list";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") || "my-files";
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const { myFiles, sharedWithMe, loading, page, setPage, hasMore } =
    useFilezSubgraph();

  const files = tab === "shared" ? sharedWithMe : myFiles;
  const filteredFiles = files.filter((file: any) =>
    file.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && page === 0) return <DashboardSkeleton />;

  return (
    <WalletGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Title & Tabs */}
              <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                <h1 className="text-xl font-semibold text-foreground hidden sm:block flex-shrink-0">
                  {tab === "shared" ? "Shared With Me" : "My Files"}
                </h1>

                {/* Tabs */}
                <div className="flex items-center bg-secondary rounded-lg p-1 overflow-x-auto max-w-[calc(100vw-8rem)] sm:max-w-none scrollbar-none">
                  <Link href="/dashboard" className="flex-shrink-0">
                    <button
                      className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                        tab !== "shared" && tab !== "activity"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      My Files
                    </button>
                  </Link>
                  <Link href="/dashboard?tab=shared" className="flex-shrink-0">
                    <button
                      className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                        tab === "shared"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Shared
                    </button>
                  </Link>
                  <Link href="/dashboard/activity" className="flex-shrink-0">
                    <button
                      className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        tab === "activity"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Activity
                    </button>
                  </Link>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                {/* View Toggle */}
                <div className="hidden sm:flex items-center bg-secondary rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "grid"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "list"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Upload Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              {
                label: "Total Files",
                value: files.length,
                icon: FileText,
              },
              {
                label: "Encrypted",
                value: files.length,
                icon: Lock,
              },
              {
                label: "On-Chain",
                value: files.length,
                icon: Shield,
              },
              {
                label: "Shared",
                value: sharedWithMe.length,
                icon: User,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredFiles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery ? "No files found" : "No files yet"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                {searchQuery
                  ? "Try a different search term"
                  : tab === "shared"
                    ? "Files shared with you will appear here"
                    : "Upload your first file to get started with private, encrypted file sharing."}
              </p>
              {!searchQuery && tab !== "shared" && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Upload Your First File
                </motion.button>
              )}
            </motion.div>
          )}

          {/* File Grid */}
          {filteredFiles.length > 0 && viewMode === "grid" && (
            <FileGrid files={filteredFiles} tab={tab} />
          )}

          {/* File List View */}
          {filteredFiles.length > 0 && viewMode === "list" && (
            <FileList files={filteredFiles} tab={tab} />
          )}

          {/* Pagination */}
          {filteredFiles.length > 0 && (
            <div className="flex items-center justify-center mt-8">
              {hasMore ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPage(page + 1)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors border border-border"
                >
                  Load More
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {filteredFiles.length} file{filteredFiles.length !== 1 && "s"}{" "}
                  total
                </p>
              )}
            </div>
          )}
        </main>

        {/* Upload Modal */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      </div>
    </WalletGuard>
  );
}
