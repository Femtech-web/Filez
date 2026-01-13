"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Files,
  Share2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Menu,
  X,
  Settings,
  HelpCircle,
  ExternalLink,
  Zap,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useFhevmContext } from "@/providers/fhevmProvider";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ElementType;
  tab: string;
}

const sidebarItems: SidebarItem[] = [
  { title: "My Files", href: "/dashboard", icon: Files, tab: "" },
  {
    title: "Shared With Me",
    href: "/dashboard?tab=shared",
    icon: Share2,
    tab: "shared",
  },
];

interface AnimatedSidebarProps {
  defaultCollapsed?: boolean;
  variant?: "desktop" | "mobile";
}

export const AnimatedSidebar = ({
  defaultCollapsed = false,
  variant = "desktop",
}: AnimatedSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") ?? "";

  const { isConnected, address } = useAccount();
  const { status } = useFhevmContext();

  // Lock scroll when mobile drawer is open
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  const renderContent = (closeMobile?: () => void) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/filez-icon.png"
                alt="FileZ"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg font-bold text-sidebar-foreground">
                FileZ
              </span>
            </Link>
          )}

          <div className="flex items-center gap-1">
            {/* Desktop collapse button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
              )}
            </button>

            {/* Mobile close button */}
            {closeMobile && (
              <button
                onClick={closeMobile}
                className="lg:hidden p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-sidebar-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      {!isCollapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain?.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="w-full px-4 py-2.5 bg-destructive hover:bg-destructive/90 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <div className="space-y-2">
                  <button
                    onClick={openChainModal}
                    className="w-full px-3 py-2 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-success" />
                    {chain?.name}
                  </button>
                  <button
                    onClick={openAccountModal}
                    className="w-full px-3 py-2 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground text-sm rounded-lg transition-colors font-mono truncate"
                  >
                    {account?.displayName}
                  </button>
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive =
            pathname === item.href.split("?")[0] &&
            ((item.tab === "" && !tab) || item.tab === tab);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => closeMobile?.()}
            >
              <div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.title}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Status Section */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border space-y-3">
          {/* FHEVM Status */}
          <div className="flex items-center gap-3 px-3 py-2 bg-sidebar-accent rounded-lg">
            {status === "ready" && (
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            )}
            {status === "loading" && (
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
            )}
            {status === "error" && (
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground">
                FHEVM
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {status}
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-1">
            <a
              href="https://docs.zama.ai/fhevm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Documentation
              <ExternalLink className="w-3 h-3 ml-auto" />
            </a>
          </div>

          {/* Powered by */}
          <div className="pt-3 border-t border-sidebar-border">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Zap className="w-3 h-3" />
              Powered by Zama FHEVM
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Desktop Sidebar
  if (variant === "desktop") {
    return (
      <aside
        className={`hidden lg:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {renderContent()}
      </aside>
    );
  }

  // Mobile Sidebar
  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-sidebar-foreground" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/filez-icon.png"
            alt="FileZ"
            width={28}
            height={28}
            className="w-7 h-7"
          />
          <span className="text-lg font-bold text-sidebar-foreground">
            FileZ
          </span>
        </Link>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 overflow-y-auto"
            >
              {renderContent(() => setMobileOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
