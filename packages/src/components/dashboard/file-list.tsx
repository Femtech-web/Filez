"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Lock,
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

interface FileListProps {
  files: any[];
  tab: string;
}

export function FileList({ files, tab }: FileListProps) {
  return (
    <motion.div
      key={`list-${tab}`}
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
        {files.map((file: any) => {
          const FileIcon = getFileIcon(file.type);
          return (
            <motion.div key={file.id} variants={itemVariants}>
              <Link
                href={tab === "shared" ? `/file/${file.fileId}` : `/file/${file.id}`}
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
  );
}
