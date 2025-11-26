"use client";

import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Web3Provider } from "./web3-provider";
import { Toaster } from "sonner";
import { FhevmProvider } from "@/providers/fhevmProvider";
import { ReactNode } from "react";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { useChainId, useWalletClient } from "wagmi";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <Web3Provider>
      <InnerProviders>{children}</InnerProviders>
    </Web3Provider>
  );
}

function InnerProviders({ children }: { children: ReactNode }) {
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const provider = walletClient?.transport;

  return (
    <FhevmProvider provider={provider ?? undefined} chainId={chainId}>
      <ErrorReporter />
      <Script
        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
        strategy="afterInteractive"
        data-target-origin="*"
        data-message-type="ROUTE_CHANGE"
        data-include-search-params="true"
        data-only-in-iframe="true"
        data-debug="true"
        data-custom-data='{"appName": "zamof", "version": "1.0.0", "greeting": "hi"}'
      />
      <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
      <Toaster position="top-right" richColors />
      <VisualEditsMessenger />
    </FhevmProvider>
  );
}
