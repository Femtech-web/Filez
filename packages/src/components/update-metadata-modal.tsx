"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileEdit,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileType,
  AlignLeft,
} from "lucide-react";
import { useFileRegistry, type FileMetadata } from "@/hooks/useFileRegistry";
import { FILE_REGISTRY_ADDRESS } from "@/lib/constants";

interface UpdateMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  currentMetadata: FileMetadata;
  symKey: Uint8Array;
  onSuccess?: (updated: { originalName: string; description?: string }) => void;
}

type UpdateStep = "input" | "updating" | "complete" | "error";

export const UpdateMetadataModal = ({
  isOpen,
  onClose,
  fileId,
  currentMetadata,
  symKey,
  onSuccess,
}: UpdateMetadataModalProps) => {
  const [updateStep, setUpdateStep] = React.useState<UpdateStep>("input");
  const [errorMessage, setErrorMessage] = React.useState("");

  // Form state
  const [originalName, setOriginalName] = React.useState(
    currentMetadata.originalName
  );
  const [description, setDescription] = React.useState(
    currentMetadata.description || ""
  );

  const { updateMetadata } = useFileRegistry(FILE_REGISTRY_ADDRESS);

  // Reset form when modal opens with new metadata
  React.useEffect(() => {
    if (isOpen) {
      setOriginalName(currentMetadata.originalName);
      setDescription(currentMetadata.description || "");
    }
  }, [isOpen, currentMetadata]);

  const hasChanges = React.useMemo(() => {
    return (
      originalName !== currentMetadata.originalName ||
      description !== (currentMetadata.description || "")
    );
  }, [originalName, description, currentMetadata]);

  const handleUpdate = async () => {
    if (!hasChanges) {
      resetModal();
      return;
    }

    if (!originalName.trim()) {
      setErrorMessage("File name is required");
      return;
    }

    try {
      setUpdateStep("updating");
      setErrorMessage("");

      const newMetadata = {
        originalName: originalName.trim(),
        mimeType: currentMetadata.mimeType,
        fileSize: currentMetadata.fileSize,
        description: description.trim() || undefined,
      };

      const success = await updateMetadata(fileId, newMetadata, symKey);

      if (success) {
        setUpdateStep("complete");
        onSuccess?.({
          originalName: newMetadata.originalName,
          description: newMetadata.description,
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        resetModal();
      } else {
        throw new Error("Update failed");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update metadata");
      setUpdateStep("error");
    }
  };

  const resetModal = () => {
    setUpdateStep("input");
    setErrorMessage("");
    onClose();
  };

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
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Update Metadata
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Edit file name and description
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
                {updateStep === "input" && (
                  <div className="space-y-6">
                    {/* Current File Info */}
                    <div className="p-4 bg-secondary/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-muted-foreground">
                            File Type
                          </p>
                          <p className="font-medium text-foreground truncate">
                            {currentMetadata.mimeType}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* File Name Input */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        File Name
                      </label>
                      <div className="relative">
                        <FileType className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={originalName}
                          onChange={(e) => setOriginalName(e.target.value)}
                          placeholder="Enter file name..."
                          className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                      {!originalName.trim() && (
                        <p className="text-xs text-destructive mt-2">
                          File name is required
                        </p>
                      )}
                    </div>

                    {/* Description Input */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description (Optional)
                      </label>
                      <div className="relative">
                        <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-muted-foreground" />
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a description..."
                          rows={4}
                          className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {description.length} characters
                      </p>
                    </div>

                    {/* Changes Summary */}
                    {hasChanges ? (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="flex items-start gap-2">
                          <FileEdit className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-foreground">
                              Changes Detected
                            </p>
                            <p className="text-muted-foreground">
                              Metadata will be re-encrypted and uploaded to IPFS
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-secondary/50 border border-border rounded-xl">
                        <p className="text-sm text-muted-foreground text-center">
                          No changes made
                        </p>
                      </div>
                    )}

                    {/* Update Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleUpdate}
                      disabled={!hasChanges || !originalName.trim()}
                      className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <FileEdit className="w-5 h-5" />
                      Update Metadata
                    </motion.button>
                  </div>
                )}

                {/* Updating State */}
                {updateStep === "updating" && (
                  <div className="py-12 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      {/* Animated file icon */}
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <FileEdit className="w-8 h-8 text-primary" />
                        </div>
                      </motion.div>

                      {/* Orbiting particles */}
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.25,
                          }}
                          className="absolute inset-0"
                          style={{ transformOrigin: "center" }}
                        >
                          <div
                            className="absolute w-2 h-2 bg-primary rounded-full"
                            style={{
                              top: "50%",
                              left: "0",
                              transform: "translateY(-50%)",
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Updating metadata...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Encrypting and uploading to IPFS
                    </p>
                  </div>
                )}

                {/* Success State */}
                {updateStep === "complete" && (
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
                      Metadata Updated!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      File metadata has been successfully updated
                    </p>
                  </motion.div>
                )}

                {/* Error State */}
                {updateStep === "error" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 text-center"
                  >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                      <AlertCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Update Failed
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {errorMessage ||
                        "Something went wrong. Please try again."}
                    </p>
                    <button
                      onClick={() => setUpdateStep("input")}
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
