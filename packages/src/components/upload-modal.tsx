"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  Shield,
  Upload as UploadIcon,
  CheckCircle2,
} from "lucide-react";
import { AnimatedButton } from "./animated-button";
import { AnimatedInput } from "./animated-input";
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
  | "complete";

export const UploadModal = ({ isOpen, onClose }: UploadModalProps) => {
  const { address } = useAccount();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [description, setDescription] = React.useState("");
  const [uploadStep, setUploadStep] = React.useState<UploadStep>("idle");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const { registerFile } = useFileRegistry(FILE_REGISTRY_ADDRESS);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStep("encrypting");

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
    }

    await new Promise((resolve) => setTimeout(resolve, 2));
    window.location.reload();
    // Reset
    setUploadStep("idle");
    setSelectedFile(null);
    setDescription("");
    onClose();
  };

  const steps = [
    {
      key: "encrypting",
      icon: Lock,
      label: "Encrypting File...",
      description: "Lock forming",
    },
    {
      key: "uploading",
      icon: UploadIcon,
      label: "Uploading to IPFS...",
      description: "Particle stream",
    },
    {
      key: "registering",
      icon: Shield,
      label: "Registering on FHEVM...",
      description: "Shield pulse",
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal Wrapper */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Upload & Encrypt File
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 space-y-6 relative">
                {uploadStep === "idle" ? (
                  <>
                    {/* Drag & Drop Zone */}
                    <motion.div
                      onClick={() => fileInputRef.current?.click()}
                      whileHover={{ borderColor: "rgba(255, 109, 31, 0.5)" }}
                      className="border-2 border-dashed border-border rounded-xl p-8 sm:p-12 text-center cursor-pointer bg-secondary/30 transition-colors break-all"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <UploadIcon
                          className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4"
                          strokeWidth={1.5}
                        />
                      </motion.div>

                      {selectedFile ? (
                        <div>
                          <p className="text-foreground font-medium mb-1 break-all">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-foreground font-medium mb-1">
                            Drop file here or click to browse
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Any file type supported
                          </p>
                        </div>
                      )}
                    </motion.div>

                    {/* Metadata Section */}
                    {selectedFile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <AnimatedInput
                          label="Filename"
                          value={selectedFile.name}
                          disabled
                        />

                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Description
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary bg-card text-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
                            placeholder="Add a description..."
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Upload Button */}
                    <AnimatedButton
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleUpload}
                      disabled={!selectedFile}
                    >
                      <Lock className="w-5 h-5" />
                      Upload & Encrypt
                    </AnimatedButton>
                  </>
                ) : uploadStep === "complete" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="inline-block p-6 bg-green-500/10 rounded-full mb-4"
                    >
                      <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 text-green-500" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Upload Complete!
                    </h3>
                    <p className="text-muted-foreground">
                      Your file has been encrypted and uploaded
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-4 py-8">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = step.key === uploadStep;
                      const isComplete =
                        steps.findIndex((s) => s.key === uploadStep) > index;

                      return (
                        <motion.div
                          key={step.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start sm:items-center gap-4"
                        >
                          <motion.div
                            animate={
                              isActive
                                ? {
                                    scale: [1, 1.2, 1],
                                    rotate:
                                      step.key === "encrypting" ? [0, 360] : 0,
                                  }
                                : {}
                            }
                            transition={{
                              duration: 2,
                              repeat: isActive ? Infinity : 0,
                            }}
                            className={`p-4 rounded-xl flex-shrink-0 ${
                              isActive
                                ? "bg-primary/20 border-2 border-primary"
                                : isComplete
                                  ? "bg-green-500/20 border-2 border-green-500"
                                  : "bg-secondary border-2 border-border"
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                isActive
                                  ? "text-primary"
                                  : isComplete
                                    ? "text-green-500"
                                    : "text-muted-foreground"
                              }`}
                              strokeWidth={1.5}
                            />
                          </motion.div>

                          <div className="flex-1 break-all">
                            <p
                              className={`font-semibold ${isActive ? "text-primary" : "text-foreground"}`}
                            >
                              {step.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {step.description}
                            </p>
                          </div>

                          {isActive && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full flex-shrink-0"
                            />
                          )}

                          {isComplete && (
                            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Cyber Noise */}
                <motion.div
                  animate={{ opacity: [0.03, 0.06, 0.03] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-50"
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
