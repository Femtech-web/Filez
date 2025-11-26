"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Key, Send, CheckCircle2 } from "lucide-react";
import { AnimatedButton } from "./animated-button";
import { AnimatedInput } from "./animated-input";
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

type ShareStep = "input" | "encrypting" | "complete";

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

  const { address } = useAccount();
  const { requestAccess, decryptKeyHandle, shareFile } = useFileRegistry(
    FILE_REGISTRY_ADDRESS
  );

  const handleShare = async () => {
    if (!recipientAddress) return;

    try {
      setShareStep("encrypting");
      const isOwner = owner?.toLowerCase() === address?.toLowerCase();

      const encryptedChunks = isOwner
        ? ownerKeyChunks
        : await requestAccess(fileId); // recipient re-sharing allowed

      if (!encryptedChunks) throw new Error("Could not retrieve key chunks");

      // Decrypt to AES key
      const symKey = await decryptKeyHandle(encryptedChunks);
      if (!symKey) throw new Error("Failed to decrypt AES key");

      await shareFile(fileId, recipientAddress, symKey);

      setShareStep("complete");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Reset
      setShareStep("input");
      setRecipientAddress("");
      onClose();
    } catch (err) {
      console.error("Share failed:", err);
      setShareStep("input");
    }
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Share Privately
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

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-6">
                {shareStep === "input" ? (
                  <>
                    {/* File Info */}
                    <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                      <p className="text-sm text-muted-foreground mb-1">
                        Sharing file:
                      </p>
                      <p className="font-semibold text-foreground truncate break-all">
                        {fileName}
                      </p>
                    </div>

                    {/* Recipient Input */}
                    <AnimatedInput
                      label="Recipient Wallet Address"
                      placeholder="0x..."
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                    />

                    {/* Info box */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm leading-relaxed">
                      <p className="text-foreground">
                        The encryption key will be re-encrypted for the
                        recipient's wallet address. Only they will be able to
                        decrypt and access this file.
                      </p>
                    </div>

                    {/* Share Button */}
                    <AnimatedButton
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleShare}
                      disabled={
                        !recipientAddress || !recipientAddress.startsWith("0x")
                      }
                    >
                      <Send className="w-5 h-5" />
                      Share Privately
                    </AnimatedButton>
                  </>
                ) : shareStep === "encrypting" ? (
                  <div className="py-12">
                    {/* Key Animation */}
                    <div className="relative h-28 sm:h-32 mb-8">
                      {/* Original key */}
                      <motion.div
                        className="absolute left-1/2 top-0 -translate-x-1/2"
                        animate={{
                          scale: [1, 1.2, 0.5],
                          opacity: [1, 1, 0],
                        }}
                        transition={{ duration: 1.5 }}
                      >
                        <div className="p-4 bg-primary/10 rounded-xl border-2 border-primary">
                          <Key
                            className="w-6 h-6 sm:w-8 sm:h-8 text-primary"
                            strokeWidth={1.5}
                          />
                        </div>
                      </motion.div>

                      {/* Key fragments */}
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute left-1/2 top-0 -translate-x-1/2"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            x: Math.cos((i * Math.PI * 2) / 6) * 50,
                            y: Math.sin((i * Math.PI * 2) / 6) * 50,
                            scale: [0, 1, 1, 0],
                            opacity: [0, 1, 1, 0],
                            rotate: [0, 360],
                          }}
                          transition={{
                            duration: 2.5,
                            delay: 0.5,
                            times: [0, 0.2, 0.8, 1],
                          }}
                        >
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full" />
                        </motion.div>
                      ))}

                      {/* Recombined key */}
                      <motion.div
                        className="absolute left-1/2 top-0 -translate-x-1/2"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: [0, 0, 1.2, 1],
                          opacity: [0, 0, 1, 1],
                        }}
                        transition={{ duration: 2.5, delay: 1.5 }}
                      >
                        <div className="p-4 bg-green-500/10 rounded-xl border-2 border-green-500">
                          <Key
                            className="w-6 h-6 sm:w-8 sm:h-8 text-green-500"
                            strokeWidth={1.5}
                          />
                        </div>
                      </motion.div>
                    </div>

                    {/* Status Text */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center px-4"
                    >
                      <p className="font-semibold text-foreground mb-2">
                        Re-encrypting key for recipient...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Key splitting → recombining → sending securely
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  /* Success Screen */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 px-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="inline-block p-6 bg-green-500/10 rounded-full mb-4"
                    >
                      <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 text-green-500" />
                    </motion.div>

                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                      Shared Successfully!
                    </h3>

                    <p className="text-sm text-muted-foreground break-all">
                      {recipientAddress} can now access this file
                    </p>
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
