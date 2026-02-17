"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Key,
  Send,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  User,
  Shield,
  Clock,
  Calendar,
} from "lucide-react";
import { useFileRegistry } from "@/hooks/useFileRegistry";
import { useAccount } from "wagmi";
import { FILE_REGISTRY_ADDRESS } from "@/lib/constants";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  owner: string;
  ownerKeyChunks: string[];
}

type ShareStep = "input" | "encrypting" | "complete" | "error";

// Expiration quick options (in seconds from now)
const EXPIRATION_OPTIONS = [
  { label: "Never", value: 0, description: "No expiration" },
  { label: "1 Hour", value: 3600, description: "Expires in 1 hour" },
  { label: "1 Day", value: 86400, description: "Expires in 24 hours" },
  { label: "1 Week", value: 604800, description: "Expires in 7 days" },
  { label: "1 Month", value: 2592000, description: "Expires in 30 days" },
  { label: "3 Months", value: 7776000, description: "Expires in 90 days" },
  { label: "6 Months", value: 15552000, description: "Expires in 180 days" },
  { label: "1 Year", value: 31536000, description: "Expires in 365 days" },
] as const;

export const ShareModal = ({
  isOpen,
  onClose,
  fileName,
  fileId,
  owner,
  ownerKeyChunks,
}: ShareModalProps) => {
  const [recipientAddress, setRecipientAddress] = React.useState("");
  const [shareStep, setShareStep] = React.useState<ShareStep>("input");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [selectedExpiration, setSelectedExpiration] = React.useState(0); // 0 = never expires
  const [customDate, setCustomDate] = React.useState("");
  const [customTime, setCustomTime] = React.useState("");
  const [useCustomDateTime, setUseCustomDateTime] = React.useState(false);

  const { address } = useAccount();
  const { requestAccess, decryptKeyHandles, shareFile } = useFileRegistry(
    FILE_REGISTRY_ADDRESS
  );

  const isValidAddress = recipientAddress.match(/^0x[a-fA-F0-9]{40}$/);

  // Calculate expiration timestamp
  const expiresAtTimestamp = React.useMemo(() => {
    if (useCustomDateTime) {
      if (!customDate || !customTime) return undefined;
      const dateTime = new Date(`${customDate}T${customTime}`);
      return Math.floor(dateTime.getTime() / 1000);
    }
    if (selectedExpiration === 0) return undefined;
    return Math.floor(Date.now() / 1000) + selectedExpiration;
  }, [selectedExpiration, useCustomDateTime, customDate, customTime]);

  const handleShare = async () => {
    if (!recipientAddress || !isValidAddress) return;

    try {
      setShareStep("encrypting");
      setErrorMessage("");

      const isOwner = owner?.toLowerCase() === address?.toLowerCase();

      const encryptedChunks = isOwner
        ? ownerKeyChunks
        : await requestAccess(fileId);

      if (!encryptedChunks) {
        throw new Error("Could not retrieve key chunks");
      }

      const symKey = await decryptKeyHandles(encryptedChunks);

      if (!symKey) {
        throw new Error("Failed to decrypt AES key");
      }

      const success = await shareFile(fileId, recipientAddress, symKey, {
        expiresAt: expiresAtTimestamp,
      });

      if (!success) {
        throw new Error("Failed to share file");
      }

      setShareStep("complete");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      resetModal();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to share file");
      setShareStep("error");
    }
  };

  const resetModal = () => {
    setShareStep("input");
    setRecipientAddress("");
    setSelectedExpiration(0);
    setUseCustomDateTime(false);
    setCustomDate("");
    setCustomTime("");
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)]"
              style={{ display: "flex", flexDirection: "column" }}
            >
              {/* Header - Fixed */}
              <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Share File
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Private, encrypted sharing
                  </p>
                </div>
                <button
                  onClick={resetModal}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="p-6 overflow-y-auto flex-1">
                {shareStep === "input" && (
                  <div className="space-y-6">
                    {/* File Info */}
                    <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted-foreground">
                          Sharing file
                        </p>
                        <p className="font-medium text-foreground truncate">
                          {fileName}
                        </p>
                      </div>
                    </div>

                    {/* Recipient Input */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Recipient Wallet Address
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          placeholder="0x..."
                          className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-sm ${
                            recipientAddress && !isValidAddress
                              ? "border-destructive"
                              : "border-border"
                          }`}
                        />
                      </div>
                      {recipientAddress && !isValidAddress && (
                        <p className="text-xs text-destructive mt-2">
                          Please enter a valid Ethereum address
                        </p>
                      )}
                    </div>

                    {/* Expiration Options */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Access Expiration
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {EXPIRATION_OPTIONS.map((option) => (
                          <motion.button
                            key={option.value}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedExpiration(option.value)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              selectedExpiration === option.value
                                ? "bg-primary/10 border-primary text-foreground"
                                : "bg-secondary border-border text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {option.value === 0 ? (
                                <Shield className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                              <span className="font-medium text-sm">
                                {option.label}
                              </span>
                            </div>
                            <p className="text-xs opacity-70">
                              {option.description}
                            </p>
                          </motion.button>
                        ))}
                      </div>

                      {/* Custom Date/Time Picker */}
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setUseCustomDateTime(!useCustomDateTime);
                            if (useCustomDateTime) {
                              setCustomDate("");
                              setCustomTime("");
                            } else {
                              setSelectedExpiration(0);
                            }
                          }}
                          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4" />
                          {useCustomDateTime ? "Use quick options" : "Set custom date & time"}
                        </button>
                      </div>

                      {/* Custom DateTime Inputs */}
                      {useCustomDateTime && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                Date
                              </label>
                              <input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                Time
                              </label>
                              <input
                                type="time"
                                value={customTime}
                                onChange={(e) => setCustomTime(e.target.value)}
                                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Expiration Preview */}
                      {((selectedExpiration > 0 && !useCustomDateTime) || (useCustomDateTime && customDate && customTime)) && expiresAtTimestamp && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg"
                        >
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-foreground">
                                Expires on
                              </p>
                              <p className="text-muted-foreground">
                                {new Date(expiresAtTimestamp * 1000).toLocaleString("en-US", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Info Banner */}
                    <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">
                          End-to-end encrypted
                        </p>
                        <p className="text-muted-foreground">
                          The decryption key will be re-encrypted for the
                          recipient. Only they can access the file.
                        </p>
                      </div>
                    </div>

                    {/* Share Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleShare}
                      disabled={!isValidAddress}
                      className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Share Privately
                    </motion.button>
                  </div>
                )}

                {/* Encrypting State */}
                {shareStep === "encrypting" && (
                  <div className="py-12 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      {/* Animated key */}
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Key className="w-8 h-8 text-primary" />
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
                      Re-encrypting key...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Creating encrypted key shares for the recipient
                    </p>
                  </div>
                )}

                {/* Success State */}
                {shareStep === "complete" && (
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
                      Shared Successfully!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      <code className="font-mono bg-secondary px-2 py-0.5 rounded">
                        {recipientAddress.slice(0, 6)}...
                        {recipientAddress.slice(-4)}
                      </code>{" "}
                      can now access this file
                    </p>
                  </motion.div>
                )}

                {/* Error State */}
                {shareStep === "error" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 text-center"
                  >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                      <AlertCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Share Failed
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {errorMessage ||
                        "Something went wrong. Please try again."}
                    </p>
                    <button
                      onClick={() => setShareStep("input")}
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
