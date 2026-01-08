"use client";

import { motion } from "framer-motion";
import { AnimatedButton } from "@/components/animated-button";
import Link from "next/link";
import { Lock, Shield, Upload, FileCheck, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/20 rounded-full"
              initial={{
                x: Math.random() * 400,
                y: Math.random() * 800,
              }}
              animate={{
                y: [null, -100, -200],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <main className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          {/* Logo + Title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center mb-12 sm:mb-16 "
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Image
                    src="/filez-icon.png"
                    alt="FileZ Logo"
                    width={80}
                    height={80}
                    className="w-16 h-16 sm:w-20 sm:h-20"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-6xl md:text-7xl font-bold text-foreground"
            >
              FileZ
            </motion.h1>
          </motion.div>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-4xl mx-auto text-center mb-16 sm:mb-20 px-2"
          >
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              Private File Sharing. <br className="hidden sm:block" />
              On-Chain. Fully Encrypted.
            </h2>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 sm:mb-12 max-w-2xl mx-auto">
              Client-side encryption + Zama FHEVM private access control.
            </p>

            <Link href="/dashboard">
              <AnimatedButton variant="primary" size="lg">
                Launch FileZ
                <ArrowRight className="w-5 h-5" />
              </AnimatedButton>
            </Link>
          </motion.div>

          {/* Encryption Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="max-w-4xl sm:max-w-5xl mx-auto mb-16 sm:mb-20 px-2"
          >
            <div className="relative">
              {/* Upload card */}
              <motion.div
                className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    Upload & Encrypt
                  </h3>

                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Shield
                      className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
                      strokeWidth={1.5}
                    />
                  </motion.div>
                </div>

                {/* Upload Zone */}
                <motion.div
                  className="border-2 border-dashed border-border rounded-xl p-8 sm:p-12 mb-6 bg-secondary/30"
                  whileHover={{ borderColor: "rgba(255,109,31,0.5)" }}
                >
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Upload
                        className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-4"
                        strokeWidth={1.5}
                      />
                    </motion.div>
                    <p className="text-foreground font-medium mb-1">
                      Drop files here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                </motion.div>

                {/* Encryption Steps */}
                <div className="space-y-3">
                  {[
                    { icon: Lock, label: "Client-side encryption", delay: 0 },
                    { icon: Shield, label: "FHEVM registration", delay: 0.2 },
                    { icon: FileCheck, label: "IPFS upload", delay: 0.4 },
                  ].map((step) => (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + step.delay }}
                      className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{
                          duration: 2,
                          delay: step.delay,
                          repeat: Infinity,
                        }}
                        className="p-2 bg-primary/10 rounded-lg"
                      >
                        <step.icon
                          className="w-4 h-4 sm:w-5 sm:h-5 text-primary"
                          strokeWidth={1.5}
                        />
                      </motion.div>
                      <span className="text-sm font-medium text-foreground">
                        {step.label}
                      </span>
                      <motion.div
                        className="ml-auto"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 2,
                          delay: step.delay,
                          repeat: Infinity,
                        }}
                      >
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Floating particles */}
              <div className="absolute inset-0 pointer-events-none hidden sm:block">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-primary rounded-full"
                    style={{ left: `${20 + i * 15}%`, top: "50%" }}
                    animate={{ y: [-50, -150], opacity: [0, 1, 0] }}
                    transition={{
                      duration: 2,
                      delay: i * 0.3,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto px-2"
          >
            {[
              {
                icon: Lock,
                title: "End-to-End Encrypted",
                description:
                  "Files are encrypted in your browser before upload",
              },
              {
                icon: Shield,
                title: "Private Access Control",
                description: "FHEVM ensures only authorized users can decrypt",
              },
              {
                icon: FileCheck,
                title: "Decentralized Storage",
                description: "Your files live on IPFS, not corporate servers",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-card border border-border rounded-xl p-6 text-center"
              >
                <div className="inline-block p-4 bg-primary/10 rounded-xl mb-4">
                  <feature.icon
                    className="w-6 h-6 sm:w-8 sm:h-8 text-primary"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </main>
      </div>
    </>
  );
}
