"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Share2,
  Lock,
  Shield,
  FileText,
  Clock,
  User,
  HardDrive,
  Database,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useFileRegistry } from "@/hooks/useFileRegistry";
import { downloadFromIPFS } from "@/lib/ipfs";
import { decryptAES } from "@/lib/crypto";
import { FILE_REGISTRY_ADDRESS } from "@/lib/constants";
import { useFileActivity, useSingleFile } from "@/hooks/useFilezSubgraph";
import { FilePageSkeleton } from "@/components/skeleton/filePageSkeleton";
import { buildTimeline } from "@/lib/transformers";
import { formatDistanceToNow } from "date-fns";
import { formatFileSize, shorten } from "@/lib/utils";
import { ShareModal } from "@/components/share-modal";
import { WalletGuard } from "@/components/wallet-guard";

export default function FilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { file, loading } = useSingleFile(id);
  const { activity } = useFileActivity(id);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);

  const [metadata, setMetadata] = useState<any>(null);
  const [aesKey, setAesKey] = useState<Uint8Array | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const { address } = useAccount();
  const { decryptKeyHandle, requestAccess, downloadFile } = useFileRegistry(
    FILE_REGISTRY_ADDRESS
  );

  const isOwner = file?.owner?.toLowerCase() === address?.toLowerCase();

  useEffect(() => {
    if (!file || !address) return;

    async function loadMetadata() {
      try {
        const encryptedChunks = isOwner
          ? file.ownerKeyChunks
          : await requestAccess(file.id);

        const key = (await decryptKeyHandle(encryptedChunks)) as Uint8Array;
        setAesKey(key);

        const encMetadataBuffer = await downloadFromIPFS(file.metadataCid);
        const text = new TextDecoder().decode(encMetadataBuffer);
        const encryptedJson = JSON.parse(text);
        const decryptedBytes = await decryptAES(encryptedJson, key);
        const json = JSON.parse(new TextDecoder().decode(decryptedBytes));

        setMetadata(json);
      } catch (err) {
        console.error("Failed to load metadata:", err);
      } finally {
        setLoadingMeta(false);
      }
    }

    loadMetadata();
  }, [file, address, isOwner]);

  const timeline = buildTimeline(activity, file?.id);

  const handleDecrypt = async () => {
    if (!aesKey || !file) return;
    setIsDecrypting(true);

    try {
      const decrypted = (await downloadFile(file.cid, aesKey)) as Uint8Array;
      const blob = new Blob([decrypted], { type: metadata?.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = metadata?.originalName || "file";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }

    setIsDecrypting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 2000);
  };

  if (loading || !file) return <FilePageSkeleton />;

  return (
    <WalletGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                </Link>

                <div>
                  <h1 className="text-lg font-semibold text-foreground truncate max-w-md">
                    {loadingMeta ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Decrypting...
                      </span>
                    ) : (
                      metadata?.originalName || "Encrypted File"
                    )}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {loadingMeta
                      ? "Loading metadata..."
                      : metadata?.mimeType || "Unknown type"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors border border-border"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDecrypt}
                  disabled={isDecrypting || !aesKey}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDecrypting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isDecrypting ? "Decrypting..." : "Download"}
                  </span>
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Preview Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                  {/* Preview Area */}
                  <div className="relative aspect-video bg-secondary flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                    <div className="relative p-8 bg-card/80 backdrop-blur-sm rounded-2xl border border-border">
                      <FileText className="w-16 h-16 text-primary" />
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-full border border-border">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-foreground">
                        Encrypted
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleDecrypt}
                        disabled={isDecrypting || !aesKey}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        onClick={handleDecrypt}
                        disabled={isDecrypting || !aesKey}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>

                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </motion.div>

                {/* Activity Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Activity
                  </h2>

                  <div className="space-y-3">
                    {timeline.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No activity yet
                      </p>
                    ) : (
                      timeline.map((event: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {event.action}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(event.time, {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* File Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-2xl p-6"
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
                          <p className="text-xs text-muted-foreground">
                            {item.label}
                          </p>
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
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    On-Chain
                  </h2>

                  <div className="space-y-4">
                    {/* File CID */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        File CID
                      </p>
                      <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                        <code className="text-xs font-mono text-foreground truncate flex-1">
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
                      <p className="text-xs text-muted-foreground mb-2">
                        Metadata CID
                      </p>
                      <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                        <code className="text-xs font-mono text-foreground truncate flex-1">
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
                      File contents and metadata are encrypted on IPFS.
                      Decryption keys are managed on-chain via Zama FHEVM.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </main>

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          fileId={file.id}
          fileName={metadata?.originalName ?? "Encrypted File"}
          owner={file.owner}
          ownerKeyChunks={file.ownerKeyChunks}
        />
      </div>
    </WalletGuard>
  );
}
