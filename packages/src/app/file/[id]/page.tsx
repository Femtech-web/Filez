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
  Loader2,
  Eye,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useFileRegistry } from "@/hooks/useFileRegistry";
import { downloadFromIPFS } from "@/lib/ipfs";
import { decryptAES } from "@/lib/crypto";
import { FILE_REGISTRY_ADDRESS } from "@/lib/constants";
import { useFileActivity, useSingleFile } from "@/hooks/useFilezSubgraph";
import { FilePageSkeleton } from "@/components/skeleton/filePageSkeleton";
import { transformFileActivityEvents } from "@/lib/transformers";
import { ShareModal } from "@/components/share-modal";
import { WalletGuard } from "@/components/wallet-guard";
import { ActivityTimelineCompact } from "@/components/activity-timeline";
import { FilePreview } from "@/components/file-preview";
import { ExtendExpirationModal } from "@/components/extend-expiration-modal";
import { UpdateMetadataModal } from "@/components/update-metadata-modal";
import { SharesPanel } from "@/components/file/shares-panel";
import { FileDetailsSidebar } from "@/components/file/file-details-sidebar";

export default function FilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { file, loading } = useSingleFile(id);
  const { activity, refetch: refetchActivity } = useFileActivity(id);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedShare, setSelectedShare] = useState<any>(null);
  const [revokingRecipient, setRevokingRecipient] = useState<string | null>(null);

  const [metadata, setMetadata] = useState<any>(null);
  const [aesKey, setAesKey] = useState<Uint8Array | null>(null);
  const [decryptedFileData, setDecryptedFileData] = useState<Uint8Array | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const { address } = useAccount();
  const { decryptKeyHandles, requestAccess, downloadFile, revokeAccess, isRevoking } = useFileRegistry(
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

        const key = (await decryptKeyHandles(encryptedChunks)) as Uint8Array;
        setAesKey(key);

        const encMetadataBuffer = await downloadFromIPFS(file.metadataCid);
        const text = new TextDecoder().decode(encMetadataBuffer);
        const encryptedJson = JSON.parse(text);
        const decryptedBytes = await decryptAES(encryptedJson, key);
        const json = JSON.parse(new TextDecoder().decode(decryptedBytes));

        setMetadata(json);
      } catch {
        // metadata loading failed silently; UI shows fallback state
      } finally {
        setLoadingMeta(false);
      }
    }

    loadMetadata();
  }, [file, address, isOwner]);

  const activityEvents = transformFileActivityEvents(activity);

  // Handle file preview
  const handlePreview = async () => {
    if (!aesKey || !file) return;

    setIsDecrypting(true);
    setPreviewError(null);
    setIsPreviewOpen(true);

    try {
      const decrypted = (await downloadFile(file.cid, aesKey)) as Uint8Array;
      setDecryptedFileData(decrypted);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Failed to decrypt file");
    } finally {
      setIsDecrypting(false);
    }
  };

  // Handle file download
  const handleDownload = async () => {
    if (!aesKey || !file) return;
    setIsDecrypting(true);

    try {
      const decrypted = (await downloadFile(file.cid, aesKey)) as Uint8Array;
      const blob = new Blob([decrypted.buffer as ArrayBuffer], { type: metadata?.mimeType || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = metadata?.originalName || "file";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // download error is shown via toast in downloadFile()
    } finally {
      setIsDecrypting(false);
    }
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

                <div className="max-w-md">
                  <h1 className="text-lg font-semibold text-foreground truncate">
                    {loadingMeta ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Decrypting...
                      </span>
                    ) : (
                      metadata?.originalName || "Encrypted File"
                    )}
                  </h1>
                  {!loadingMeta && metadata?.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {metadata.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {loadingMeta
                        ? "Loading metadata..."
                        : metadata?.mimeType || "Unknown type"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsEditModalOpen(true)}
                      disabled={!aesKey || !metadata}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors border border-border disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors border border-border"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Share</span>
                    </motion.button>
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePreview}
                  disabled={isDecrypting || !aesKey}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors border border-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Preview</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
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
                        onClick={handlePreview}
                        disabled={isDecrypting || !aesKey}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        onClick={handleDownload}
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

                {/* Activity Timeline - V2 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Activity Timeline
                  </h2>

                  <ActivityTimelineCompact
                    events={activityEvents}
                    currentUserAddress={address}
                    maxItems={10}
                  />
                </motion.div>

                {/* Shares Management - Only visible to file owner */}
                {isOwner && activity?.shares && activity.shares.length > 0 && (
                  <SharesPanel
                    shares={activity.shares}
                    fileId={file.id}
                    onRevoke={async (recipient) => {
                      setRevokingRecipient(recipient);
                      const success = await revokeAccess(file.id, recipient);
                      setRevokingRecipient(null);
                      if (success) refetchActivity();
                    }}
                    onExtend={(share) => {
                      setSelectedShare(share);
                      setIsExtendModalOpen(true);
                    }}
                    isRevoking={isRevoking}
                    revokingRecipient={revokingRecipient}
                  />
                )}
              </div>

              {/* Sidebar */}
              <FileDetailsSidebar file={file} metadata={metadata} />
            </div>
          </div>
        </main>

        {/* Edit Metadata Modal */}
        {metadata && aesKey && (
          <UpdateMetadataModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            fileId={file.id}
            currentMetadata={metadata}
            symKey={aesKey}
            onSuccess={({ originalName, description }) =>
              setMetadata((prev: any) => ({ ...prev, originalName, description }))
            }
          />
        )}

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          fileId={file.id}
          fileName={metadata?.originalName ?? "Encrypted File"}
          owner={file.owner}
          ownerKeyChunks={file.ownerKeyChunks}
        />

        {/* File Preview Modal */}
        <FilePreview
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setDecryptedFileData(null);
            setPreviewError(null);
          }}
          fileData={decryptedFileData}
          fileName={metadata?.originalName || "Encrypted File"}
          mimeType={metadata?.mimeType || "application/octet-stream"}
          isLoading={isDecrypting}
          error={previewError}
          onDownload={handleDownload}
        />

        {/* Extend Expiration Modal */}
        {selectedShare && (
          <ExtendExpirationModal
            isOpen={isExtendModalOpen}
            onClose={() => {
              setIsExtendModalOpen(false);
              setSelectedShare(null);
            }}
            fileId={file.id}
            fileName={metadata?.originalName || "Encrypted File"}
            recipient={selectedShare.recipient}
            currentExpiresAt={selectedShare.expiresAt}
            onSuccess={() => {
              refetchActivity();
            }}
          />
        )}
      </div>
    </WalletGuard>
  );
}
