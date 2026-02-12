"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Shield,
  Lock,
  Users,
  FileCheck,
  Globe,
  Key,
  CheckCircle2,
  ExternalLink,
  Play,
  Building2,
  Scale,
  Heart,
  Blocks,
  Twitter,
  ChevronRight,
  Sparkles,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";

// ============================================
// ANIMATION VARIANTS
// ============================================

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// ============================================
// COMPONENTS
// ============================================

function AnimatedGradientOrb() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary orb */}
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
      {/* Secondary orb */}
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

function EncryptionVisual() {
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
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2">
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

function TestimonialCard() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={scaleIn}
      className="relative"
    >
      {/* Quote mark */}
      <div className="absolute -top-4 -left-2 text-6xl text-primary/20 font-serif">
        "
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden">
        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />

        <div className="relative">
          {/* Quote */}
          <p className="text-lg text-foreground leading-relaxed mb-6">
            Very nice! Heard several companies ask for something like this,
            basically using blockchains for access control to files that can't
            be stored onchain.{" "}
            <span className="text-primary font-semibold">
              This can definitely be a startup.
            </span>
          </p>

          {/* Author */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-bold text-lg">
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

function UseCaseCard({
  icon: Icon,
  title,
  description,
  examples,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  examples: string[];
  delay?: number;
}) {
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

function StatCard({
  value,
  label,
  delay = 0,
}: {
  value: string;
  label: string;
  delay?: number;
}) {
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

// ============================================
// MAIN PAGE
// ============================================

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ============================================
          NAVIGATION
          ============================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/filez-icon.png"
                alt="FileZ"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold">FileZ</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#use-cases"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Use Cases
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                How it Works
              </a>
              <a
                href="#security"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Security
              </a>
            </div>

            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Launch App
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center pt-16"
      >
        <AnimatedGradientOrb />
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Badge */}
              <motion.div variants={fadeInUp} className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">
                    Powered by Zama FHEVM
                  </span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1 variants={fadeInUp} className="text-display mb-6">
                The Only File Sharing Where{" "}
                <span className="text-primary">Permissions</span> Are Encrypted
                Too
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeInUp}
                className="text-body-lg mb-8 max-w-xl"
              >
                Most "private" storage encrypts your files but leaks who you
                share with. FileZ encrypts everything — files, metadata, and
                access control, using Fully Homomorphic Encryption.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap gap-4 mb-10"
              >
                <Link href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 glow"
                  >
                    Start Sharing Privately
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>

                <a
                  href="https://youtu.be/qcCBQ687Pk8"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 bg-card text-foreground font-semibold rounded-xl hover:bg-secondary transition-all flex items-center gap-2 border border-border"
                  >
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </motion.button>
                </a>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Powered by Zama
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  On-Chain Verified
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Client-Side Encryption
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Visual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative bg-card/50 border border-border rounded-2xl p-8 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />
                <div className="relative h-64 flex items-center justify-center">
                  <EncryptionVisual />
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute -bottom-4 -right-4 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-medium flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Zero Knowledge
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-border rounded-full flex justify-center pt-2"
          >
            <div className="w-1.5 h-3 bg-muted-foreground rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ============================================
          SOCIAL PROOF / TESTIMONIAL
          ============================================ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm text-primary font-medium mb-2">
              ENDORSED BY INDUSTRY LEADERS
            </p>
          </motion.div>

          <TestimonialCard />
        </div>
      </section>

      {/* ============================================
          PROBLEM / SOLUTION
          ============================================ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeInUp}
              className="text-sm text-primary font-medium mb-4"
            >
              THE PRIVACY PROBLEM
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-headline mb-4">
              "Encrypted" Doesn't Mean Private
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-body-lg max-w-2xl mx-auto"
            >
              Every decentralized storage solution encrypts files. But they all
              leak the same thing: who you're sharing with.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Problem */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-red-500/5 border border-red-500/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold">
                  Traditional "Encryption"
                </h3>
              </div>

              <ul className="space-y-4">
                {[
                  "Files encrypted, permissions in plaintext",
                  "Metadata reveals sharing relationships",
                  "Access control relies on trusted servers",
                  "Anyone can see who shares with whom",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-muted-foreground"
                  >
                    <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Solution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-green-500/5 border border-green-500/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold">FileZ with FHE</h3>
              </div>

              <ul className="space-y-4">
                {[
                  "Files AND permissions encrypted",
                  "Metadata is cryptographically hidden",
                  "Smart contract validates without seeing data",
                  "Only intended recipients can decrypt",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-muted-foreground"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURES
          ============================================ */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeInUp}
              className="text-sm text-primary font-medium mb-4"
            >
              CORE FEATURES
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-headline mb-4">
              Privacy That's Mathematically Proven
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-body-lg max-w-2xl mx-auto"
            >
              Built on cryptographic primitives, not promises.
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: "Client-Side AES-256",
                description:
                  "Files encrypted in your browser before upload. Keys never touch our servers.",
              },
              {
                icon: Key,
                title: "FHE Key Sharding",
                description:
                  "Encryption keys split into 4 chunks, each encrypted with Fully Homomorphic Encryption.",
              },
              {
                icon: Shield,
                title: "On-Chain Access Control",
                description:
                  "Smart contract enforces permissions without ever seeing the decrypted keys.",
              },
              {
                icon: Users,
                title: "Private Sharing",
                description:
                  "Share by re-encrypting key chunks for recipients. No metadata leakage.",
              },
              {
                icon: Globe,
                title: "IPFS Storage",
                description:
                  "Encrypted files stored on decentralized infrastructure. No single point of failure.",
              },
              {
                icon: Zap,
                title: "Instant Indexing",
                description:
                  "Subgraph-powered queries for fast file retrieval and sharing history.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          USE CASES
          ============================================ */}
      <section id="use-cases" className="py-24 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeInUp}
              className="text-sm text-primary font-medium mb-4"
            >
              USE CASES
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-headline mb-4">
              Built for Sensitive Data
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-body-lg max-w-2xl mx-auto"
            >
              Any industry that needs true privacy, not just compliance theater.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <UseCaseCard
              icon={Scale}
              title="Legal & Compliance"
              description="Share contracts, NDAs, and sensitive legal documents with opposing counsel or clients."
              examples={["M&A docs", "NDAs", "Court filings"]}
              delay={0}
            />
            <UseCaseCard
              icon={Heart}
              title="Healthcare"
              description="Transfer medical records, imaging, and patient data between providers securely."
              examples={["Patient records", "Lab results", "Imaging"]}
              delay={0.1}
            />
            <UseCaseCard
              icon={Building2}
              title="Enterprise"
              description="Protect trade secrets, R&D files, and internal communications from competitors."
              examples={["R&D files", "Strategy docs", "IP"]}
              delay={0.2}
            />
            <UseCaseCard
              icon={Blocks}
              title="Web3 & DAOs"
              description="Manage treasury docs, governance proposals, and sensitive operational files."
              examples={["Treasury", "Proposals", "Multisig"]}
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS
          ============================================ */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeInUp}
              className="text-sm text-primary font-medium mb-4"
            >
              HOW IT WORKS
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-headline mb-4">
              Four Steps to True Privacy
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Upload & Encrypt",
                description:
                  "Select your file. AES-256-GCM encryption happens entirely in your browser.",
                icon: FileCheck,
              },
              {
                step: "02",
                title: "Store Securely",
                description:
                  "Encrypted file goes to IPFS. Key splits into 4 FHE-encrypted chunks on-chain.",
                icon: Globe,
              },
              {
                step: "03",
                title: "Share Privately",
                description:
                  "Key chunks re-encrypted for recipient's wallet. Only they can ever decrypt.",
                icon: Users,
              },
              {
                step: "04",
                title: "Access & Verify",
                description:
                  "Recipient retrieves chunks, decrypts via FHE, downloads the original file.",
                icon: Key,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {index < 3 && (
                  <div className="hidden md:block absolute top-12 left-[calc(100%+0.5rem)] w-[calc(100%-1rem)] h-px">
                    <div className="w-full h-full bg-gradient-to-r from-border via-primary/30 to-border" />
                    <ChevronRight className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                  </div>
                )}

                <div className="text-6xl font-bold text-primary/10 mb-4">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          STATS
          ============================================ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-card/30 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="256-bit" label="AES Encryption" delay={0} />
            <StatCard value="4×64" label="FHE Key Chunks" delay={0.1} />
            <StatCard value="100%" label="Client-Side" delay={0.2} />
            <StatCard value="0" label="Trusted Parties" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ============================================
          SECURITY & TRUST
          ============================================ */}
      <section id="security" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-sm text-primary font-medium mb-4">
                SECURITY & TRUST
              </p>
              <h2 className="text-headline mb-6">
                Built for Enterprise. Secured by Math.
              </h2>
              <p className="text-body-lg mb-8">
                FileZ is built on battle-tested cryptographic infrastructure.
                Our security doesn't rely on promises — it's enforced by
                mathematics and verified on-chain.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  {
                    icon: Shield,
                    label: "On-Chain Verification",
                    value: "Smart contract deployed & verified on Ethereum",
                    link: "https://sepolia.etherscan.io/address/0x414117f52c51849B174545839780B85E672A1cdE",
                  },
                  {
                    icon: Lock,
                    label: "Powered by Zama",
                    value: "Industry-leading Fully Homomorphic Encryption",
                    link: "https://www.zama.ai",
                  },
                  {
                    icon: FileCheck,
                    label: "Zero Knowledge Architecture",
                    value: "We can't see your files or who you share with",
                    link: null,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="font-medium">{item.value}</p>
                      </div>
                    </div>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Security Architecture Visual */}
              <div className="rounded-2xl bg-card border border-border p-8 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />

                <div className="relative space-y-6">
                  <h3 className="text-lg font-semibold text-center mb-8">
                    Security Architecture
                  </h3>

                  {/* Layer 1 */}
                  <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Your Browser</p>
                      <p className="text-xs text-muted-foreground">
                        AES-256-GCM encryption happens here
                      </p>
                    </div>
                    <Lock className="w-5 h-5 text-green-400" />
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="w-px h-6 bg-gradient-to-b from-border to-primary/50" />
                  </div>

                  {/* Layer 2 */}
                  <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Key className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Zama FHEVM</p>
                      <p className="text-xs text-muted-foreground">
                        Keys encrypted with FHE on-chain
                      </p>
                    </div>
                    <Lock className="w-5 h-5 text-green-400" />
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="w-px h-6 bg-gradient-to-b from-primary/50 to-border" />
                  </div>

                  {/* Layer 3 */}
                  <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">IPFS Storage</p>
                      <p className="text-xs text-muted-foreground">
                        Encrypted files on decentralized storage
                      </p>
                    </div>
                    <Lock className="w-5 h-5 text-green-400" />
                  </div>

                  {/* Bottom badge */}
                  <div className="flex justify-center pt-4">
                    <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      End-to-End Encrypted
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          CTA
          ============================================ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-12 md:p-16 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-radial opacity-50" />

            <div className="relative">
              <h2 className="text-headline mb-4">Ready for True Privacy?</h2>
              <p className="text-body-lg mb-8 max-w-xl mx-auto">
                Join the future of file sharing where your permissions are as
                private as your files.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                  >
                    Launch FileZ
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>

                <a
                  href="https://youtu.be/qcCBQ687Pk8"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 bg-card text-foreground font-semibold rounded-xl hover:bg-secondary transition-all flex items-center gap-2 border border-border"
                  >
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </motion.button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/filez-icon.png"
                alt="FileZ"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-sm text-muted-foreground">
                © 2025 FileZ. All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="https://twitter.com/DefiPreacherr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
