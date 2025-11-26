"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedCard } from "@/components/animated-card";
import { AnimatedButton } from "@/components/animated-button";
import { AnimatedBadge } from "@/components/animated-badge";
import { ShareModal } from "@/components/share-modal";
import { WalletGuard } from "@/components/wallet-guard";
import {
  FileText,
  Download,
  Share2,
  ArrowLeft,
  Lock,
  Database,
  Calendar,
  User,
  HardDrive,
  Eye,
  Shield,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

import { useAccount } from "wagmi";
import { useFileRegistry } from "@/hooks/useFileRegistry";
import { downloadFromIPFS } from "@/lib/ipfs";
import { decryptAES } from "@/lib/crypto";
import { FILE_REGISTRY_ADDRESS } from "@/lib/constants";
import { useFileActivity, useSingleFile } from "@/hooks/useFilezSubgraph";
import { FilePageSkeleton } from "@/components/skeleton/filePageSkeleton";
import { buildTimeline } from "@/lib/transformers";
import { formatDistanceToNow } from "date-fns";
import { formatFileSize } from "@/lib/utils";

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

  const [metadata, setMetadata] = useState<any>(null);
  const [aesKey, setAesKey] = useState<Uint8Array | null | any>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const { address } = useAccount();
  const { decryptKeyHandle, requestAccess, downloadFile } = useFileRegistry(
    FILE_REGISTRY_ADDRESS
  );

  useEffect(() => {
    if (!file || !address) return;

    async function loadMetadata() {
      try {
        const isOwner = file.owner?.toLowerCase() === address?.toLowerCase();

        // Retrieve encrypted key chunks
        const encryptedChunks = isOwner
          ? file.ownerKeyChunks
          : await requestAccess(file.id);

        const key = (await decryptKeyHandle(
          encryptedChunks
        )) as Uint8Array<ArrayBufferLike>;
        setAesKey(key);

        const encMetadataBuffer = await downloadFromIPFS(file.metadataCid);

        // Convert ArrayBuffer to text
        const text = new TextDecoder().decode(encMetadataBuffer);
        const encryptedJson = JSON.parse(text);

        // decrypt to plaintext
        const decryptedBytes = await decryptAES(encryptedJson, key);

        // Convert plaintext to JSON metadata
        const json = JSON.parse(new TextDecoder().decode(decryptedBytes));

        setMetadata(json);
      } catch (err) {
        console.error("Failed to load metadata:", err);
      } finally {
        setLoadingMeta(false);
      }
    }

    loadMetadata();
  }, [file, address]);

  const timeline = buildTimeline(activity, file?.id);

  const handleDecrypt = async () => {
    if (!aesKey) return;
    setIsDecrypting(true);

    try {
      const decrypted = (await downloadFile(file.cid, aesKey)) as any;

      const blob = new Blob([decrypted], { type: metadata?.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = metadata?.originalName || "file";
      a.click();
    } catch (err) {
      console.error("Download failed:", err);
    }

    setIsDecrypting(false);
  };

  if (loading || !file) return <FilePageSkeleton />;

  return (
    <WalletGuard>
      <div className="flex h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-5 lg:pt-0">
          <div className="min-h-screen bg-background p-4 md:p-8">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6"
            >
              <Link href="/dashboard">
                <AnimatedButton variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Files
                </AnimatedButton>
              </Link>
            </motion.div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    <h1 className="text-2xl md:text-4xl font-bold text-foreground break-all blur-sm hover:blur-none transition-all cursor-pointer">
                      {loadingMeta
                        ? "Decrypting..."
                        : (metadata?.originalName ?? "Encrypted File")}
                    </h1>
                  </div>
                  <p className="text-muted-foreground blur-[2px] hover:blur-none transition-all cursor-pointer break-all">
                    {loadingMeta
                      ? "Decrypting..."
                      : (metadata?.description ?? "Encrypted description")}
                  </p>
                </div>

                <AnimatedBadge variant="success" className="self-start">
                  {file.status}
                </AnimatedBadge>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
              {/* Encrypted File Preview */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 space-y-6"
              >
                <AnimatedCard>
                  {/* Large Encrypted Blur Preview */}
                  <div className="relative aspect-video md:aspect-[16/10] rounded-xl bg-gradient-to-br from-secondary to-secondary/50 overflow-hidden border-2 border-border">
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

                    {/* Encrypted Icon */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                        }}
                        className="p-8 md:p-12 bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-border"
                      >
                        <FileText
                          className="w-20 h-20 md:w-32 md:h-32 text-primary"
                          strokeWidth={1}
                        />
                      </motion.div>
                    </div>

                    {/* Encrypted Metadata Badge */}
                    <motion.div
                      className="absolute top-3 left-3 md:top-4 md:left-4"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="px-3 py-2 bg-card/80 backdrop-blur-sm rounded-xl border border-border flex items-center gap-2">
                        <Lock
                          className="w-4 h-4 text-primary"
                          strokeWidth={1.5}
                        />
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          Encrypted Preview
                        </span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <AnimatedButton
                      variant="primary"
                      className="flex-1"
                      onClick={handleDecrypt}
                      disabled={isDecrypting}
                    >
                      {isDecrypting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            <Lock className="w-5 h-5" />
                          </motion.div>
                          Decrypting...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Decrypt & Download
                        </>
                      )}
                    </AnimatedButton>

                    <AnimatedButton
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsShareModalOpen(true)}
                    >
                      <Share2 className="w-5 h-5" />
                      Share Privately
                    </AnimatedButton>
                  </div>
                </AnimatedCard>

                {/* Encrypted Activity Timeline */}
                <AnimatedCard>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Shield
                      className="w-5 h-5 text-primary"
                      strokeWidth={1.5}
                    />
                    Encrypted Activity
                  </h3>

                  <div className="space-y-3">
                    {timeline.map((event, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full" />

                        <div className="flex-1 blur-[2px] hover:blur-none transition-all">
                          <p className="text-sm font-medium text-foreground break-all">
                            {event.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(event.time, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>

                        <Lock
                          className="w-4 h-4 text-muted-foreground"
                          strokeWidth={1.5}
                        />
                      </motion.div>
                    ))}
                  </div>
                </AnimatedCard>
              </motion.div>

              {/* File Details Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <AnimatedCard>
                  <h2 className="text-2xl font-bold mb-6">File Details</h2>

                  <div className="space-y-4">
                    {[
                      {
                        icon: FileText,
                        label: "Type",
                        value: metadata?.mimeType ?? "_",
                      },
                      {
                        icon: HardDrive,
                        label: "Size",
                        value: formatFileSize(metadata?.fileSize) || "_",
                      },
                      {
                        icon: User,
                        label: "Uploaded By",
                        value: file.owner ?? "_",
                        mono: true,
                      },
                      {
                        icon: Calendar,
                        label: "Upload Date",
                        value: metadata?.uploadedAt
                          ? new Date(metadata.uploadedAt).toLocaleDateString(
                              "en-US",
                              { year: "numeric", month: "long", day: "numeric" }
                            )
                          : "_",
                      },
                      {
                        icon: Calendar,
                        label: "Last Modified",
                        value: metadata?.lastModifiedAt
                          ? new Date(
                              metadata.lastModifiedAt
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "_",
                      },
                    ].map((detail, index) => (
                      <motion.div
                        key={detail.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <detail.icon
                            className="w-5 h-5 text-primary"
                            strokeWidth={1.5}
                          />
                        </div>

                        <div className="flex-1 break-all">
                          <p className="text-sm text-muted-foreground">
                            {detail.label}
                          </p>
                          <p
                            className={`font-semibold ${detail.mono ? "font-mono text-sm" : ""}`}
                          >
                            {detail.value}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatedCard>

                {/* On-Chain Details */}
                <AnimatedCard>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Database
                      className="w-5 h-5 text-primary"
                      strokeWidth={1.5}
                    />
                    On-Chain Details
                  </h3>

                  <div className="space-y-3">
                    {/* File CID */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        File CID
                      </p>
                      <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                        <a
                          href={`https://${file.cid}.ipfs.storacha.link`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-foreground break-all underline flex-1 hover:text-primary"
                        >
                          {file.cid}
                        </a>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Metadata CID */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Metadata CID
                      </p>
                      <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                        <a
                          href={`https://${file.metadataCid}.ipfs.storacha.link`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-foreground break-all underline flex-1 hover:text-primary"
                        >
                          {file.metadataCid}
                        </a>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AnimatedBadge variant="default">
                        <Lock className="w-3 h-3" strokeWidth={1.5} />
                        Encrypted
                      </AnimatedBadge>

                      <AnimatedBadge variant="default">
                        <Shield className="w-3 h-3" strokeWidth={1.5} />
                        On-chain
                      </AnimatedBadge>

                      <AnimatedBadge variant="default">
                        FHEVM Secured
                      </AnimatedBadge>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                      All stored content remains encrypted on IPFS. Decryption
                      keys are managed on-chain via Zama FHEVM.
                    </p>
                  </div>
                </AnimatedCard>
              </motion.div>
            </div>

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
        </main>
      </div>
    </WalletGuard>
  );
}
