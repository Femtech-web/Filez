"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileCheck, Lock, Shield } from "lucide-react";

export function EncryptionVisual() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* File icon */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2"
        animate={{
          x: step >= 1 ? 60 : 0,
          opacity: step >= 2 ? 0 : 1,
          scale: step >= 1 ? 0.8 : 1,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div className="w-16 h-20 bg-card border border-border rounded-lg flex items-center justify-center">
          <FileCheck className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Your File
        </p>
      </motion.div>

      {/* Lock/Encryption */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          scale: step === 1 || step === 2 ? 1.1 : 1,
          rotate: step === 2 ? [0, -10, 10, 0] : 0,
        }}
        transition={{ duration: 0.5 }}
      >
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            step >= 1
              ? "bg-primary/20 border-2 border-primary"
              : "bg-secondary border border-border"
          }`}
        >
          <Lock
            className={`w-10 h-10 transition-colors duration-500 ${
              step >= 1 ? "text-primary" : "text-muted-foreground"
            }`}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AES-256 + FHE
        </p>
      </motion.div>

      {/* Chain/Output */}
      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2"
        animate={{
          x: step >= 2 ? -60 : 0,
          opacity: step >= 2 ? 1 : 0.3,
          scale: step >= 3 ? 1.05 : 1,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div
          className={`w-16 h-20 rounded-lg flex items-center justify-center transition-all duration-500 ${
            step >= 3
              ? "bg-green-500/10 border-2 border-green-500"
              : "bg-card border border-border"
          }`}
        >
          <Shield
            className={`w-8 h-8 transition-colors duration-500 ${
              step >= 3 ? "text-green-500" : "text-muted-foreground"
            }`}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          On-Chain
        </p>
      </motion.div>

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
        <motion.line
          x1="20%"
          y1="50%"
          x2="40%"
          y2="50%"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 4"
          className="text-border"
          animate={{ opacity: step >= 1 ? 1 : 0.2 }}
        />
        <motion.line
          x1="60%"
          y1="50%"
          x2="80%"
          y2="50%"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 4"
          className="text-border"
          animate={{ opacity: step >= 2 ? 1 : 0.2 }}
        />
      </svg>

      {/* Step indicator */}
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? "bg-primary w-6" : "bg-border w-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
