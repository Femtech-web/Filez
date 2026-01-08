"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Lock,
  Files,
  Share2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useFhevmContext } from "@/providers/fhevmProvider";
import Image from "next/image";

interface SidebarItem {
  title: string;
  href: string;
  icon: any;
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

  const { isConnected } = useAccount();
  const { status } = useFhevmContext();

  // lock scroll while mobile drawer is open
  React.useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const renderSidebarContent = (closeMobile?: () => void) => {
    return (
      <motion.div
        className="relative z-10 flex flex-col h-full p-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
      >
        {/* Collapse button (desktop only) */}
        <motion.div
          className="flex items-center justify-between mb-8 pb-4 border-b border-sidebar-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {!isCollapsed && (
            <motion.div
              className="flex items-center"
              initial={{ x: -8, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Image
                  src="/filez-icon.png"
                  alt="FileZ"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              </motion.div>
              <span className="text-2xl font-bold text-sidebar-foreground">
                FileZ
              </span>
            </motion.div>
          )}

          <motion.div className="flex items-center gap-2">
            <motion.button
              onClick={() => setIsCollapsed((s) => !s)}
              className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors hidden lg:inline-flex"
              aria-label="Collapse sidebar"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-sidebar-foreground" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
              )}
            </motion.button>

            {/* mobile close X (renders inside drawer when mobile) */}
            {closeMobile && (
              <motion.button
                onClick={() => closeMobile()}
                className="p-2 rounded-lg bg-sidebar-accent lg:hidden"
                aria-label="Close menu"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
              >
                <X className="w-5 h-5 text-sidebar-foreground" />
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* Wallet panel */}
        {!isCollapsed && (
          <motion.div
            className="mb-6 p-4 bg-sidebar-accent rounded-xl border border-sidebar-border"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
          >
            <motion.div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-xs font-semibold text-sidebar-foreground">
                WALLET
              </span>
            </motion.div>

            <ConnectButton.Custom>
              {(props) => renderConnectUI(props)}
            </ConnectButton.Custom>
          </motion.div>
        )}

        {/* Nav items */}
        <nav className="flex-1 space-y-2 overflow-y-auto">
          {sidebarItems.map((item, idx) => {
            const isActive =
              pathname === item.href.split("?")[0] &&
              ((item.tab === "" && !tab) || item.tab === tab);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (closeMobile) closeMobile();
                }}
              >
                <motion.div
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 my-3 rounded-xl transition-all group",
                    isActive
                      ? "bg-primary text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 + 0.02 }}
                  whileHover={{ x: 6 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-primary rounded-xl"
                      layoutId="activeTab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}

                  <motion.div
                    className="relative z-10"
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </motion.div>

                  {!isCollapsed && (
                    <motion.span
                      className="relative z-10 font-medium"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.02 }}
                    >
                      {item.title}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Status area */}
        {!isCollapsed && (
          <motion.div
            className="pt-4 border-t border-sidebar-border space-y-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="flex items-center gap-2 px-4 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {isConnected ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <div>
                <p className="text-xs font-medium text-sidebar-foreground">
                  Wallet
                </p>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Connected" : "Not connected"}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center gap-2 px-4 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.03 }}
            >
              {status === "ready" && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
              {status === "loading" && (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              )}
              {status === "error" && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}

              <div>
                <p className="text-xs font-medium text-sidebar-foreground">
                  FHEVM
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {status}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  //  Desktop sidebar
  const DesktopSidebar = () => {
    return (
      <aside
        className="relative h-screen bg-sidebar border-r border-sidebar-border overflow-hidden flex-shrink-0 z-20"
        style={{ width: isCollapsed ? 80 : 280 }}
        aria-hidden={false}
      >
        {renderSidebarContent()}
      </aside>
    );
  };

  //  Mobile topbar + drawer
  const MobileTopBar = ({ open }: { open: () => void }) => (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border">
      <button
        onClick={open}
        className="p-2 rounded-lg bg-sidebar-accent"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-sidebar-foreground" />
      </button>
      <span className="text-xl font-bold text-sidebar-foreground">FileZ</span>
    </div>
  );

  const MobileDrawer = () => {
    return (
      <>
        <MobileTopBar open={() => setMobileOpen(true)} />

        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />

              {/* Drawer */}
              <motion.aside
                key="drawer"
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 h-screen w-72 bg-sidebar border-r border-sidebar-border z-50 overflow-y-auto"
                aria-modal="true"
                role="dialog"
              >
                {renderSidebarContent(() => setMobileOpen(false))}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  };

  // Render variant
  if (variant === "desktop") return <DesktopSidebar />;
  return <MobileDrawer />;
};

function renderConnectUI({
  account,
  chain,
  openAccountModal,
  openChainModal,
  openConnectModal,
  mounted,
}: any) {
  const ready = mounted;
  const connected = ready && account && chain;

  if (!connected) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={openConnectModal}
        className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
      >
        Connect Wallet
      </motion.button>
    );
  }

  if (chain?.unsupported) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={openChainModal}
        className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
      >
        Wrong network
      </motion.button>
    );
  }

  return (
    <div className="space-y-2">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={openChainModal}
        className="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        {chain?.name}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={openAccountModal}
        className="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded-lg transition-colors"
      >
        {account?.displayName}
      </motion.button>
    </div>
  );
}
