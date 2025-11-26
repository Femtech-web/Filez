"use client";

import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { LoadingSpinner } from "./loading-spinner";
import { Lock, Wallet } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface WalletGuardProps {
  children: React.ReactNode;
}

export function WalletGuard({ children }: WalletGuardProps) {
  const { address, isConnecting, isDisconnected } = useAccount();

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground text-sm sm:text-base">
            Connecting wallet...
          </p>
        </div>
      </div>
    );
  }

  if (isDisconnected || !address) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm sm:max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center shadow-xl w-full">
            {/* Lock Icon Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl mb-6"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Lock
                  className="w-8 h-8 sm:w-10 sm:h-10 text-primary"
                  strokeWidth={1.5}
                />
              </motion.div>
            </motion.div>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Connect Your Wallet
            </h2>

            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
              You need to connect your wallet to access the FileZ dashboard and
              manage your encrypted files.
            </p>

            {/* Connect Button */}
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openConnectModal}
                  className="w-full px-6 py-3 sm:py-4 bg-primary hover:bg-primary/90 text-white text-sm sm:text-base font-semibold rounded-xl transition-colors flex items-center justify-center gap-3"
                >
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                  Connect Wallet
                </motion.button>
              )}
            </ConnectButton.Custom>

            {/* Info */}
            <div className="mt-6 sm:mt-8 pt-6 border-t border-border">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Your wallet is required for encryption keys and secure file
                access.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
