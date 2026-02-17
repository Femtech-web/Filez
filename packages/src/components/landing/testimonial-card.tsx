"use client";

import { motion } from "framer-motion";
import { Twitter } from "lucide-react";
import { scaleIn } from "./animation-variants";

export function TestimonialCard() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={scaleIn as any}
      className="relative"
    >
      <div className="absolute -top-4 -left-2 text-6xl text-primary/20 font-serif">
        "
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent" />

        <div className="relative">
          <p className="text-lg text-foreground leading-relaxed mb-6">
            Very nice! Heard several companies ask for something like this,
            basically using blockchains for access control to files that can't
            be stored onchain.{" "}
            <span className="text-primary font-semibold">
              This can definitely be a startup.
            </span>
          </p>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-orange-600 flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <div>
              <p className="font-semibold text-foreground">Rand Hindi</p>
              <p className="text-sm text-muted-foreground">
                Founder & CEO, Zama
              </p>
            </div>
            <div className="ml-auto">
              <a
                href="https://x.com/randhindi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="w-4 h-4" />
                @randhindi
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
