"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  Shield,
  Upload as UploadIcon,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useFileRegistry } from "@/hooks/useFileRegistry";
import { FILE_REGISTRY_ADDRESS } from "@/lib/constants";
import { useAccount } from "wagmi";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UploadStep =
  | "idle"
  | "encrypting"
  | "uploading"
  | "registering"
  | "complete"
  | "error";

export const UploadModal = ({ isOpen, onClose }: UploadModalProps) => {
  const { address } = useAccount();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [description, setDescription] = React.useState("");
  const [uploadStep, setUploadStep] = React.useState<UploadStep>("idle");
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { registerFile } = useFileRegistry(FILE_REGISTRY_ADDRESS);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStep("encrypting");

    try {
      const fileId = await registerFile(
        selectedFile,
        {
          originalName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
          description,
          uploadedAt: Date.now(),
          lastModifiedAt: selectedFile.lastModified,
          owner: address,
          status: "active",
        },
        setUploadStep
      );

      if (fileId) {
        setUploadStep("complete");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        window.location.reload();
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadStep("error");
    }
  };

  const resetModal = () => {
    setUploadStep("idle");
    setSelectedFile(null);
    setDescription("");
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const steps = [
    {
      key: "encrypting",
      icon: Lock,
      title: "Encrypting file",
      description: "AES-256-GCM encryption in your browser",
    },
    {
      key: "uploading",
      icon: UploadIcon,
      title: "Uploading to IPFS",
      description: "Storing encrypted file on decentralized storage",
    },
    {
      key: "registering",
      icon: Shield,
      title: "Registering on-chain",
      description: "Creating FHE-encrypted key shares on FHEVM",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Upload File
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Encrypted end-to-end before upload
                  </p>
                </div>
                <button
                  onClick={resetModal}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {uploadStep === "idle" && (
                  <div className="space-y-6">
                    {/* Drop Zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        dragActive
                          ? "border-primary bg-primary/5"
                          : selectedFile
                            ? "border-success bg-success/5"
                            : "border-border hover:border-primary/50 hover:bg-secondary/30"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {selectedFile ? (
                        <div className="space-y-3">
                          <div className="w-14 h-14 mx-auto rounded-xl bg-success/10 flex items-center justify-center">
                            <FileText className="w-7 h-7 text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground truncate max-w-xs mx-auto">
                              {selectedFile.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                            }}
                            className="text-sm text-primary hover:underline"
                          >
                            Choose different file
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-14 h-14 mx-auto rounded-xl bg-secondary flex items-center justify-center">
                            <UploadIcon className="w-7 h-7 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              Drop file here or click to browse
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Any file type supported
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description Field */}
                    {selectedFile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Description (optional)
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a description..."
                          rows={3}
                          className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
                        />
                      </motion.div>
                    )}

                    {/* Info Banner */}
                    <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">
                          Client-side encryption
                        </p>
                        <p className="text-muted-foreground">
                          Your file is encrypted in your browser before upload.
                          Only you and people you share with can decrypt it.
                        </p>
                      </div>
                    </div>

                    {/* Upload Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleUpload}
                      disabled={!selectedFile}
                      className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Lock className="w-5 h-5" />
                      Encrypt & Upload
                    </motion.button>
                  </div>
                )}

                {/* Progress States */}
                {(uploadStep === "encrypting" ||
                  uploadStep === "uploading" ||
                  uploadStep === "registering") && (
                  <div className="py-8 space-y-6">
                    {steps.map((step, index) => {
                      const isActive = step.key === uploadStep;
                      const isComplete =
                        steps.findIndex((s) => s.key === uploadStep) > index;
                      const Icon = step.icon;

                      return (
                        <motion.div
                          key={step.key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                            isActive
                              ? "bg-primary/10 border border-primary/30"
                              : isComplete
                                ? "bg-success/5"
                                : "bg-secondary/30"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isActive
                                ? "bg-primary/20"
                                : isComplete
                                  ? "bg-success/20"
                                  : "bg-secondary"
                            }`}
                          >
                            {isActive ? (
                              <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            ) : isComplete ? (
                              <CheckCircle2 className="w-6 h-6 text-success" />
                            ) : (
                              <Icon className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium ${
                                isActive
                                  ? "text-primary"
                                  : isComplete
                                    ? "text-success"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {step.title}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {step.description}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Success State */}
                {uploadStep === "complete" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        delay: 0.1,
                      }}
                      className="w-20 h-20 mx-auto rounded-2xl bg-success/10 flex items-center justify-center mb-6"
                    >
                      <CheckCircle2 className="w-10 h-10 text-success" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Upload Complete!
                    </h3>
                    <p className="text-muted-foreground">
                      Your file has been encrypted and stored securely.
                    </p>
                  </motion.div>
                )}

                {/* Error State */}
                {uploadStep === "error" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 text-center"
                  >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                      <AlertCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Upload Failed
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Something went wrong. Please try again.
                    </p>
                    <button
                      onClick={() => setUploadStep("idle")}
                      className="px-6 py-2.5 bg-secondary text-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      Try Again
                    </button>
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
