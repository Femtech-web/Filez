"use client";

import { motion } from "framer-motion";

interface UseCaseCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  examples: string[];
  delay?: number;
}

export function UseCaseCard({
  icon: Icon,
  title,
  description,
  examples,
  delay = 0,
}: UseCaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className="h-full p-6 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all duration-300">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <span
              key={ex}
              className="px-2 py-1 text-xs bg-secondary text-muted-foreground rounded-md"
            >
              {ex}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
