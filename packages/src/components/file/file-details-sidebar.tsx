"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  HardDrive,
  User,
  Clock,
  Database,
  Lock,
  Shield,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { formatFileSize, shorten } from "@/lib/utils";

interface FileDetailsSidebarProps {
  file: any;
  metadata: any;
}

export function FileDetailsSidebar({ file, metadata }: FileDetailsSidebarProps) {
  const [copiedCid, setCopiedCid] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* File Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-4 sm:p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          File Details
        </h2>

        <div className="space-y-4">
          {[
            {
              icon: FileText,
              label: "Type",
              value: metadata?.mimeType || "Encrypted",
            },
            {
              icon: HardDrive,
              label: "Size",
              value: formatFileSize(metadata?.fileSize) || "—",
            },
            {
              icon: User,
              label: "Owner",
              value: shorten(file.owner),
              mono: true,
            },
            {
              icon: Clock,
              label: "Uploaded",
              value: metadata?.uploadedAt
                ? new Date(metadata.uploadedAt).toLocaleDateString()
                : "—",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p
                  className={`text-sm font-medium text-foreground truncate ${
                    item.mono ? "font-mono" : ""
                  }`}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* On-Chain Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-4 sm:p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          On-Chain
        </h2>

        <div className="space-y-4">
          {/* File CID */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">File CID</p>
            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg overflow-hidden">
              <code className="text-xs font-mono text-foreground truncate flex-1 min-w-0">
                {file.cid}
              </code>
              <button
                onClick={() => copyToClipboard(file.cid)}
                className="p-1.5 hover:bg-secondary rounded-md transition-colors flex-shrink-0"
              >
                {copiedCid ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
              <a
                href={`https://${file.cid}.ipfs.storacha.link`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-secondary rounded-md transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Metadata CID */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Metadata CID</p>
            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg overflow-hidden">
              <code className="text-xs font-mono text-foreground truncate flex-1 min-w-0">
                {file.metadataCid}
              </code>
              <a
                href={`https://${file.metadataCid}.ipfs.storacha.link`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-secondary rounded-md transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              <Lock className="w-3 h-3" />
              Encrypted
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
              <Shield className="w-3 h-3" />
              On-Chain
            </span>
            <span className="inline-flex items-center px-2.5 py-1 bg-secondary text-muted-foreground text-xs font-medium rounded-full">
              FHEVM
            </span>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            File contents and metadata are encrypted on IPFS. Decryption keys
            are managed on-chain via Zama FHEVM.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
