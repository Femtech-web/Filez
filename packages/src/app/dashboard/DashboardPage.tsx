"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Upload,
  Lock,
  ExternalLink,
  Shield,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  MoreHorizontal,
  Grid3X3,
  List,
  Search,
  Filter,
  Plus,
  Clock,
  User,
  ChevronRight,
} from "lucide-react";
import { useFilezSubgraph } from "@/hooks/useFilezSubgraph";
import { UploadModal } from "@/components/upload-modal";
import { WalletGuard } from "@/components/wallet-guard";
import { DashboardSkeleton } from "@/components/skeleton/dashboardSkeleton";

const getFileIcon = (type: string) => {
  if (type?.startsWith("image/")) return ImageIcon;
  if (type?.startsWith("video/")) return Film;
  if (type?.startsWith("audio/")) return Music;
  if (type?.includes("zip") || type?.includes("rar")) return Archive;
  return FileText;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

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
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Title & Tabs */}
              <div className="flex items-center gap-6">
                <h1 className="text-xl font-semibold text-foreground hidden sm:block">
                  {tab === "shared" ? "Shared With Me" : "My Files"}
                </h1>

                {/* Tabs */}
                <div className="flex items-center bg-secondary rounded-lg p-1">
                  <Link href="/dashboard">
                    <button
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        tab !== "shared"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      My Files
                    </button>
                  </Link>
                  <Link href="/dashboard?tab=shared">
                    <button
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        tab === "shared"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Shared
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
        <main className="p-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredFiles.map((file: any) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <motion.div key={file.id} variants={itemVariants}>
                    <Link
                      href={
                        tab === "shared"
                          ? `/file/${file.fileId}`
                          : `/file/${file.id}`
                      }
                    >
                      <div className="group p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer">
                        {/* Preview Area */}
                        <div className="relative aspect-[4/3] rounded-lg bg-secondary mb-4 flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                          <div className="relative p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border group-hover:scale-105 transition-transform">
                            <FileIcon className="w-8 h-8 text-primary" />
                          </div>

                          {/* Encrypted indicator */}
                          <div className="absolute top-2 right-2 p-1.5 bg-card/90 backdrop-blur-sm rounded-md border border-border">
                            <Lock className="w-3 h-3 text-primary" />
                          </div>
                        </div>

                        {/* File Info */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-foreground truncate text-sm group-hover:text-primary transition-colors">
                              {file.name}
                            </h3>
                            <button className="p-1 hover:bg-secondary rounded-md transition-colors opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {file.uploadedAt}
                            </span>
                            <span>{file.size}</span>
                          </div>

                          {/* Tags */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
                              <Shield className="w-2.5 h-2.5" />
                              FHE
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 bg-secondary text-muted-foreground text-[10px] font-medium rounded-full">
                              IPFS
                            </span>
                            {tab === "shared" && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-medium rounded-full">
                                Shared
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* File List View */}
          {filteredFiles.length > 0 && viewMode === "list" && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-secondary/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-5">Name</div>
                <div className="col-span-2 hidden md:block">Size</div>
                <div className="col-span-3 hidden sm:block">Modified</div>
                <div className="col-span-2">Status</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {filteredFiles.map((file: any) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <motion.div key={file.id} variants={itemVariants}>
                      <Link
                        href={
                          tab === "shared"
                            ? `/file/${file.fileId}`
                            : `/file/${file.id}`
                        }
                      >
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-secondary/30 transition-colors cursor-pointer group">
                          <div className="col-span-5 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileIcon className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground truncate text-sm group-hover:text-primary transition-colors">
                              {file.name}
                            </span>
                          </div>
                          <div className="col-span-2 hidden md:flex items-center text-sm text-muted-foreground">
                            {file.size}
                          </div>
                          <div className="col-span-3 hidden sm:flex items-center text-sm text-muted-foreground">
                            {file.uploadedAt}
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
                              <Lock className="w-2.5 h-2.5" />
                              Encrypted
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
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
