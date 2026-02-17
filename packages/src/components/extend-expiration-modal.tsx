"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarPlus,
} from "lucide-react";
import { useFileRegistry } from "@/hooks/useFileRegistry";
import { FILE_REGISTRY_ADDRESS } from "@/lib/constants";
import { toast } from "sonner";

interface ExtendExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  recipient: string;
  currentExpiresAt: number; // Unix timestamp in seconds
  onSuccess?: () => void;
}

type ExtendStep = "input" | "extending" | "complete" | "error";

// Extension duration options (in seconds)
const EXTENSION_OPTIONS = [
  { label: "1 Day", value: 86400, description: "Add 24 hours" },
  { label: "1 Week", value: 604800, description: "Add 7 days" },
  { label: "2 Weeks", value: 1209600, description: "Add 14 days" },
  { label: "1 Month", value: 2592000, description: "Add 30 days" },
  { label: "3 Months", value: 7776000, description: "Add 90 days" },
  { label: "6 Months", value: 15552000, description: "Add 180 days" },
] as const;

export const ExtendExpirationModal = ({
  isOpen,
  onClose,
  fileId,
  fileName,
  recipient,
  currentExpiresAt,
  onSuccess,
}: ExtendExpirationModalProps) => {
  const [selectedExtension, setSelectedExtension] = React.useState(604800); // Default: 1 week
  const [extendStep, setExtendStep] = React.useState<ExtendStep>("input");
  const [errorMessage, setErrorMessage] = React.useState("");

  const { extendShareExpiration, isRevoking } = useFileRegistry(
    FILE_REGISTRY_ADDRESS
  );

  // Calculate new expiration timestamp
  const newExpiresAt = React.useMemo(() => {
    return Number(currentExpiresAt) + selectedExtension;
  }, [currentExpiresAt, selectedExtension]);

  // Validate new expiration
  const isValidExtension = React.useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const maxExpiration = now + 31536000; // 365 days from now
    const current = Number(currentExpiresAt);
    return newExpiresAt > current && newExpiresAt <= maxExpiration;
  }, [newExpiresAt, currentExpiresAt]);

  const handleExtend = async () => {
    if (!isValidExtension) {
      toast.error("Invalid expiration extension");
      return;
    }

    try {
      setExtendStep("extending");
      setErrorMessage("");

      const success = await extendShareExpiration(
        fileId,
        recipient,
        newExpiresAt
      );

      if (success) {
        setExtendStep("complete");
        onSuccess?.();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        resetModal();
      } else {
        throw new Error("Extension failed");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to extend expiration");
      setExtendStep("error");
    }
  };

  const resetModal = () => {
    setExtendStep("input");
    setSelectedExtension(604800); // Reset to 1 week
    setErrorMessage("");
    onClose();
  };

  // Format timestamp for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
                    Extend Expiration
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Extend access for this recipient
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
                {extendStep === "input" && (
                  <div className="space-y-6">
                    {/* File Info */}
                    <div className="p-4 bg-secondary/50 rounded-xl space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">File</p>
                        <p className="font-medium text-foreground truncate">
                          {fileName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Recipient
                        </p>
                        <p className="font-mono text-sm text-foreground">
                          {recipient.slice(0, 6)}...{recipient.slice(-4)}
                        </p>
                      </div>
                    </div>

                    {/* Current Expiration */}
                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">
                            Current Expiration
                          </p>
                          <p className="text-muted-foreground">
                            {formatDate(currentExpiresAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Extension Options */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Extend By
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {EXTENSION_OPTIONS.map((option) => (
                          <motion.button
                            key={option.value}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedExtension(option.value)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              selectedExtension === option.value
                                ? "bg-primary/10 border-primary text-foreground"
                                : "bg-secondary border-border text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4" />
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
                    </div>

                    {/* New Expiration Preview */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
                    >
                      <div className="flex items-start gap-2">
                        <CalendarPlus className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">
                            New Expiration
                          </p>
                          <p className="text-muted-foreground">
                            {formatDate(newExpiresAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Validation Warning */}
                    {!isValidExtension && (
                      <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">
                            Invalid Extension
                          </p>
                          <p className="text-muted-foreground">
                            New expiration must be after current expiration and
                            within 365 days from now.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Extend Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleExtend}
                      disabled={!isValidExtension || isRevoking}
                      className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CalendarPlus className="w-5 h-5" />
                      Extend Expiration
                    </motion.button>
                  </div>
                )}

                {/* Extending State */}
                {extendStep === "extending" && (
                  <div className="py-12 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      {/* Animated calendar */}
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <CalendarPlus className="w-8 h-8 text-primary" />
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
                      Extending expiration...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Updating share expiration on-chain
                    </p>
                  </div>
                )}

                {/* Success State */}
                {extendStep === "complete" && (
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
                      Expiration Extended!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Access now expires on{" "}
                      <strong className="text-foreground">
                        {formatDate(newExpiresAt)}
                      </strong>
                    </p>
                  </motion.div>
                )}

                {/* Error State */}
                {extendStep === "error" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 text-center"
                  >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                      <AlertCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Extension Failed
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {errorMessage ||
                        "Something went wrong. Please try again."}
                    </p>
                    <button
                      onClick={() => setExtendStep("input")}
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
