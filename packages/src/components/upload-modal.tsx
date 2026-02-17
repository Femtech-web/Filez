"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  Upload as UploadIcon,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
} from "lucide-react";
import { useFileRegistry, UploadStep } from "@/hooks/useFileRegistry";
import { FILE_REGISTRY_ADDRESS } from "@/lib/constants";
import { useAccount } from "wagmi";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileEntry {
  file: File;
  description: string;
  step: UploadStep;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

function FileRow({
  entry,
  index,
  onRemove,
  onDescriptionChange,
  uploading,
}: {
  entry: FileEntry;
  index: number;
  onRemove: (i: number) => void;
  onDescriptionChange: (i: number, val: string) => void;
  uploading: boolean;
}) {
  const { file, description, step } = entry;

  const isActive = step !== "idle" && step !== "complete" && step !== "error";

  const statusLabel =
    step === "encrypting" ? "Encrypting…" :
    step === "uploading" ? "Uploading…" :
    step === "registering" ? "Registering…" :
    step === "complete" ? "Done" :
    step === "error" ? "Failed" :
    null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`p-3 rounded-xl border transition-colors ${
        step === "complete" ? "border-success/30 bg-success/5" :
        step === "error" ? "border-destructive/30 bg-destructive/5" :
        isActive ? "border-primary/30 bg-primary/5" :
        "border-border bg-secondary/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          step === "complete" ? "bg-success/15" :
          step === "error" ? "bg-destructive/15" :
          isActive ? "bg-primary/15" :
          "bg-secondary"
        }`}>
          {step === "complete" ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : step === "error" ? (
            <AlertCircle className="w-4 h-4 text-destructive" />
          ) : isActive ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <FileText className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            {!uploading && step === "idle" && (
              <button
                onClick={() => onRemove(index)}
                className="p-1 hover:bg-secondary rounded-md transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
            {statusLabel && (
              <>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className={`text-xs font-medium ${
                  step === "complete" ? "text-success" :
                  step === "error" ? "text-destructive" :
                  "text-primary"
                }`}>{statusLabel}</span>
              </>
            )}
          </div>

          {step === "idle" && (
            <input
              type="text"
              value={description}
              onChange={(e) => onDescriptionChange(index, e.target.value)}
              placeholder="Add a description (optional)"
              className="mt-2 w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const UploadModal = ({ isOpen, onClose }: UploadModalProps) => {
  const { address } = useAccount();
  const [entries, setEntries] = React.useState<FileEntry[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { registerFile, registerFileBulk } = useFileRegistry(FILE_REGISTRY_ADDRESS);

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    setEntries((prev) => [
      ...prev,
      ...arr.map((f) => ({ file: f, description: "", step: "idle" as UploadStep })),
    ]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDescription = (index: number, val: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, description: val } : e))
    );
  };

  const setFileStep = (index: number, step: UploadStep) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, step } : e))
    );
  };

  const handleUpload = async () => {
    if (!entries.length) return;
    setUploading(true);

    const metadataList = entries.map(({ file, description }) => ({
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      description,
      uploadedAt: Date.now(),
      lastModifiedAt: file.lastModified,
      owner: address,
    }));

    if (entries.length === 1) {
      setFileStep(0, "encrypting");
      const fileId = await registerFile(
        entries[0].file,
        metadataList[0],
        (step) => setFileStep(0, step)
      );
      setFileStep(0, fileId ? "complete" : "error");
    } else {
      await registerFileBulk(
        entries.map((e) => e.file),
        metadataList,
        (index, step) => setFileStep(index, step)
      );
    }

    setUploading(false);
    setDone(true);
    await new Promise((r) => setTimeout(r, 1500));
    window.location.reload();
  };

  const resetModal = () => {
    if (uploading) return;
    setEntries([]);
    setUploading(false);
    setDone(false);
    onClose();
  };

  const allComplete = entries.length > 0 && entries.every((e) => e.step === "complete");
  const successCount = entries.filter((e) => e.step === "complete").length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Upload Files</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Encrypted end-to-end before upload
                  </p>
                </div>
                <button
                  onClick={resetModal}
                  disabled={uploading}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-40"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">

                {/* Drop zone — hidden while uploading or done */}
                {!uploading && !done && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-secondary/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="w-12 h-12 mx-auto rounded-xl bg-secondary flex items-center justify-center mb-3">
                      <UploadIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      Drop files here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select multiple files at once
                    </p>
                  </div>
                )}

                {/* File list */}
                {entries.length > 0 && (
                  <AnimatePresence initial={false}>
                    <div className="space-y-2">
                      {entries.map((entry, i) => (
                        <FileRow
                          key={`${entry.file.name}-${i}`}
                          entry={entry}
                          index={i}
                          onRemove={removeEntry}
                          onDescriptionChange={updateDescription}
                          uploading={uploading}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                )}

                {/* Add more files button */}
                {entries.length > 0 && !uploading && !done && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/40 rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add more files
                  </button>
                )}

                {/* Info banner */}
                {!uploading && !done && entries.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Client-side encryption</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {entries.length > 1
                          ? `${entries.length} files will encrypt and upload to IPFS in parallel. On-chain registration runs one at a time.`
                          : "Your file is encrypted in your browser. Only you and people you share with can decrypt it."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border flex-shrink-0">
                {!done ? (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleUpload}
                    disabled={!entries.length || uploading}
                    className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading {entries.length} {entries.length === 1 ? "file" : "files"}…
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Encrypt & Upload
                        {entries.length > 0 && (
                          <span className="ml-1 px-2 py-0.5 bg-primary-foreground/20 rounded-full text-xs font-medium">
                            {entries.length}
                          </span>
                        )}
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-1"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {allComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-400" />
                      )}
                      <span className="font-semibold text-foreground">
                        {allComplete
                          ? entries.length === 1
                            ? "File uploaded!"
                            : `All ${entries.length} files uploaded!`
                          : `${successCount} of ${entries.length} uploaded`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Refreshing dashboard…</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
