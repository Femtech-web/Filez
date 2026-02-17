"use client";

import useSWR from "swr";
import { subgraphClient } from "@/lib/subgraphClient";
import {
  GET_FILE,
  GET_FILE_ACTIVITY,
  GET_MY_FILES,
  GET_SHARED_WITH_ME,
  GET_USER_ACTIVITY,
  GET_GLOBAL_STATS
} from "@/lib/queries";
import { useAccount } from "wagmi";
import { transformOnchainFile, transformSharedFile, transformActivityEvents } from "@/lib/transformers";
import { useState } from "react";
import type { ActivityEvent } from "@/components/activity-timeline";

const fetcher = (query: string, vars: any) =>
  subgraphClient.request(query, vars);

export function useFilezSubgraph() {
  const { address } = useAccount();
  const addr = address ?? null;

  const pageSize = 9;
  const [page, setPage] = useState(0);

  const skip = page * pageSize;

  const {
    data: myFilesData,
    error: myFilesError,
    isLoading: myFilesLoading,
  } = useSWR(
    addr ? ["my-files", addr, page] : null,
    () => fetcher(GET_MY_FILES, { owner: addr, first: pageSize, skip })
  );

  const {
    data: sharedData,
    error: sharedError,
    isLoading: sharedLoading,
  } = useSWR(
    addr ? ["shared-with-me", addr, page] : null,
    () =>
      fetcher(GET_SHARED_WITH_ME, {
        recipient: addr,
        first: pageSize,
        skip,
      })
  );

  const myFiles = (myFilesData?.files || []).map(transformOnchainFile);
  const sharedWithMe = (sharedData?.shares || []).map(transformSharedFile);

  const hasMore =
    (myFilesData?.files?.length === pageSize) ||
    (sharedData?.shares?.length === pageSize);

  return {
    myFiles,
    sharedWithMe,
    loading: myFilesLoading || sharedLoading,
    error: myFilesError || sharedError,
    page,
    setPage,
    hasMore,
    pageSize,
  };
}

export function useSingleFile(id: string | null) {
  const { data, error, isLoading } = useSWR(
    id ? ["file", id] : null,
    () => fetcher(GET_FILE, { id })
  );

  return {
    file: data?.file || null,
    loading: isLoading,
    error,
  };
}

export function useFileActivity(fileId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    fileId ? ["file-activity", fileId] : null,
    () => fetcher(GET_FILE_ACTIVITY, { id: fileId })
  );

  return {
    activity: data || null,
    loading: isLoading,
    error,
    refetch: mutate,
  };
}

/**
 * Hook to get user's activity timeline (all events involving the user)
 */
export function useUserActivity(pageSize: number = 20) {
  const { address } = useAccount();
  const [page, setPage] = useState(0);
  const skip = page * pageSize;

  const { data, error, isLoading, mutate } = useSWR(
    address ? ["user-activity", address, page] : null,
    () => fetcher(GET_USER_ACTIVITY, {
      userAddress: address,
      first: pageSize,
      skip
    })
  );

  // Transform subgraph data into ActivityEvent[]
  const events: ActivityEvent[] = data ? transformActivityEvents(data, address!) : [];

  const hasMore = data && (
    data.files?.length === pageSize ||
    data.sharesAsOwner?.length === pageSize ||
    data.accessEvents?.length === pageSize
  );

  return {
    events,
    loading: isLoading,
    error,
    page,
    setPage,
    hasMore,
    refresh: mutate,
  };
}

/**
 * Hook to get global platform stats
 */
export function useGlobalStats() {
  const { data, error, isLoading } = useSWR(
    "global-stats",
    () => fetcher(GET_GLOBAL_STATS, {})
  );

  return {
    stats: data?.globalStats || null,
    loading: isLoading,
    error,
  };
}