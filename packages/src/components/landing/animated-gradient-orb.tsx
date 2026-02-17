"use client";

import { motion } from "framer-motion";

export function AnimatedGradientOrb() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,109,31,0.15) 0%, rgba(255,109,31,0.05) 40%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-[30%] -left-[20%] w-[60%] h-[60%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,109,31,0.1) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
