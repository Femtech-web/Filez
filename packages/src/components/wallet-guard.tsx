"use client";

import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { Lock, Wallet, Loader2, Shield, Zap } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";

interface WalletGuardProps {
  children: React.ReactNode;
}

export function WalletGuard({ children }: WalletGuardProps) {
  const { address, isConnecting, isDisconnected } = useAccount();

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 mx-auto mb-4"
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
          <p className="text-muted-foreground">Connecting wallet...</p>
        </div>
      </div>
    );
  }

  if (isDisconnected || !address) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none opacity-50" />
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-30" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-xl">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <Image
                src="/filez-icon.png"
                alt="FileZ"
                width={48}
                height={48}
                className="w-12 h-12"
              />
              <span className="text-2xl font-bold text-foreground">FileZ</span>
            </motion.div>

            {/* Lock Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Lock className="w-10 h-10 text-primary" />
              </motion.div>
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground mb-3">
              Connect Your Wallet
            </h2>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              Connect your wallet to access FileZ and manage your encrypted
              files securely.
            </p>

            {/* Connect Button */}
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openConnectModal}
                  className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors flex items-center justify-center gap-3"
                >
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </motion.button>
              )}
            </ConnectButton.Custom>

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      End-to-End Encrypted
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Files encrypted locally
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      FHE Protected
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Keys secured on-chain
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
