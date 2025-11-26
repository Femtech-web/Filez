"use client";

import useSWR from "swr";
import { subgraphClient } from "@/lib/subgraphClient";
import { GET_FILE, GET_FILE_ACTIVITY, GET_MY_FILES, GET_SHARED_WITH_ME } from "@/lib/queries";
import { useAccount } from "wagmi";
import { transformOnchainFile, transformSharedFile } from "@/lib/transformers";
import { useState } from "react";

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
  const { data, error, isLoading } = useSWR(
    fileId ? ["file-activity", fileId] : null,
    () => fetcher(GET_FILE_ACTIVITY, { id: fileId })
  );

  return {
    activity: data || null,
    loading: isLoading,
    error,
  };
}