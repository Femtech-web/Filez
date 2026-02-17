"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  value: string;
  label: string;
  delay?: number;
}

export function StatCard({ value, label, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <p className="text-4xl md:text-5xl font-bold text-primary mb-2">
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}
