import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: "FileZ — Fully Encrypted File Sharing Powered by FHE",
  description:
    "FileZ is a next-generation encrypted file sharing platform built on Zama FHEVM. Share files privately, control access with encrypted permissions, and keep data unreadable to everyone — including the blockchain.",

  keywords: [
    "FileZ",
    "encrypted file sharing",
    "FHE file sharing",
    "Zama FHEVM",
    "private file storage",
    "zero-knowledge encryption",
    "secure file transfer",
    "on-chain encryption",
    "AES-GCM file encryption",
    "Web3 privacy",
    "decentralized file permissions",
    "private IPFS",
    "Web3 storage security",
  ],

  authors: [{ name: "FileZ" }],
  creator: "FileZ",
  publisher: "FileZ",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://filez.xyz/",
    siteName: "FileZ",
    title: "FileZ — Fully Encrypted File Sharing Powered by FHE",
    description:
      "A privacy-first file sharing platform using Fully Homomorphic Encryption. Your files stay encrypted end-to-end: share, revoke, and control access with zero trust.",
    images: [
      {
        url: "/og-filez.png",
        width: 1200,
        height: 630,
        alt: "FileZ — Encrypted File Sharing Interface",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@your_handle",
    creator: "@your_handle",
    title: "FileZ — Fully Encrypted On-Chain File Sharing",
    description:
      "FileZ lets you share files privately using end-to-end encryption and Zama FHEVM. True privacy. Zero trust.",
    images: ["/og-filez.png"],
  },

  alternates: {
    canonical: "https://filez.xyz/",
  },

  category: "privacy tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />
        <Providers>{children}</Providers>
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
