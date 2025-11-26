"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useFhevm, FhevmGoState } from "../fhevm/useFhevm";
import type { FhevmInstance } from "../fhevm/fhevmTypes";
import { ethers } from "ethers";
import { toast } from "sonner";

type FhevmContextType = {
  instance: FhevmInstance | undefined;
  status: FhevmGoState;
  error: Error | undefined;
  refresh: () => void;
};

const FhevmContext = createContext<FhevmContextType | undefined>(undefined);

export function FhevmProvider({
  children,
  provider,
  chainId,
}: {
  children: React.ReactNode;
  provider: string | ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
}) {
  const { instance, status, error, refresh } = useFhevm({
    provider,
    chainId: chainId,
    enabled: true,
    initialMockChains: {},
  });

  useEffect(() => {
    if (status === "error") toast.error("fhevm encountered an error");
    if (status === "idle") toast.info("fhevm is idle");
    if (status === "ready") toast.success("fhevm is created and ready!");
  }, [status]);

  return (
    <FhevmContext.Provider value={{ instance, status, error, refresh }}>
      {children}
    </FhevmContext.Provider>
  );
}

export function useFhevmContext() {
  const ctx = useContext(FhevmContext);
  if (!ctx) {
    throw new Error("useFhevmContext must be used within <FhevmProvider>");
  }
  return ctx;
}
