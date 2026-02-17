"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Lock,
  Shield,
  Clock,
  MoreHorizontal,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function getFileIcon(type: string) {
  if (type?.startsWith("image/")) return ImageIcon;
  if (type?.startsWith("video/")) return Film;
  if (type?.startsWith("audio/")) return Music;
  if (type?.includes("zip") || type?.includes("rar")) return Archive;
  return FileText;
}

interface FileGridProps {
  files: any[];
  tab: string;
}

export function FileGrid({ files, tab }: FileGridProps) {
  return (
    <motion.div
      key={`grid-${tab}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {files.map((file: any) => {
        const FileIcon = getFileIcon(file.type);
        return (
          <motion.div key={file.id} variants={itemVariants}>
            <Link
              href={tab === "shared" ? `/file/${file.fileId}` : `/file/${file.id}`}
            >
              <div className="group p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer">
                {/* Preview Area */}
                <div className="relative aspect-[4/3] rounded-lg bg-secondary mb-4 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <div className="relative p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border group-hover:scale-105 transition-transform">
                    <FileIcon className="w-8 h-8 text-primary" />
                  </div>
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
  );
}
