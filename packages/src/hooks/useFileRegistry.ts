"use client";

import { useCallback, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useFhevmContext } from "@/providers/fhevmProvider";
import { useEthersSigner } from "@/hooks/useEthersSigner";
import { toast } from "sonner";
import { ethers, ContractTransactionResponse } from "ethers";
import { ABIS } from "@/abis";
import {
  encryptAES,
  decryptAES,
  encryptedToFile
} from "@/lib/crypto";
import {
  uploadToIPFS,
  downloadFromIPFS
} from "@/lib/ipfs";
import { keyToU64Chunks, u64ChunksToKey } from "@/lib/utils";
import { useInMemoryStorage } from "./useInMemoryStorage";
import { FhevmDecryptionSignature } from "../fhevm";

/*//////////////////////////////////////////////////////////////
                        TYPES
//////////////////////////////////////////////////////////////*/

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  fileSize: number;
  description?: string;
  uploadedAt: number;
  lastModifiedAt?: number;
  owner: string;
  status: "active" | "deleted";
}

export interface ShareOptions {
  expiresAt?: number; // Unix timestamp, 0 or undefined = never expires
}

export interface ShareRecord {
  exists: boolean;
  sharedAt: number;
  expiresAt: number;
  isRevoked: boolean;
  isExpired: boolean;
}

export type UploadStep =
  | "idle"
  | "encrypting"
  | "uploading"
  | "registering"
  | "complete"
  | "error";

/*//////////////////////////////////////////////////////////////
                        CONSTANTS
//////////////////////////////////////////////////////////////*/

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// Must match contract MAX_EXPIRATION_DURATION
const MAX_EXPIRATION_DURATION = 365 * 24 * 60 * 60; // 365 days in seconds
const UINT32_MAX = 4294967295; // Max uint32 value (year 2106)

/*//////////////////////////////////////////////////////////////
                        HELPERS
//////////////////////////////////////////////////////////////*/

function toUint32Timestamp(timestamp: number): number {
  // If timestamp is 0 (never expires), return 0
  if (timestamp === 0) return 0;

  // Validate timestamp is in valid range
  if (timestamp < 0) {
    throw new Error("Timestamp cannot be negative");
  }

  if (timestamp > UINT32_MAX) {
    throw new Error(`Timestamp ${timestamp} exceeds uint32 max (year 2106)`);
  }

  // Convert to uint32 (floor to remove decimals)
  return Math.floor(timestamp);
}

/**
 * Retry wrapper for async operations
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on user rejection or known failures
      if (
        lastError.message.includes("user rejected") ||
        lastError.message.includes("User denied") ||
        lastError.message.includes("NotFileOwner") ||
        lastError.message.includes("NoAccess") ||
        lastError.message.includes("InvalidNonce")
      ) {
        throw lastError;
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Wait for transaction with timeout
 */
async function waitForTx(
  tx: ContractTransactionResponse,
  timeoutMs: number = 60000
): Promise<ethers.ContractTransactionReceipt | null> {
  const receipt = await Promise.race([
    tx.wait(),
    new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("Transaction timeout")), timeoutMs)
    )
  ]);

  return receipt;
}

/*//////////////////////////////////////////////////////////////
                        HOOK
//////////////////////////////////////////////////////////////*/

export function useFileRegistry(fileRegistryAddress: string) {
  const { address } = useAccount();
  const { instance: fhevm, status } = useFhevmContext();
  const { signer } = useEthersSigner();
  const { data: walletClient } = useWalletClient();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();

  // Loading states
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getContract = useCallback(async () => {
    if (!signer) {
      throw new Error("Signer not available");
    }

    const signerInstance = await signer;

    return new ethers.Contract(
      fileRegistryAddress,
      ABIS.FileRegistry,
      signerInstance
    );
  }, [signer, fileRegistryAddress]);

  const registerFile = useCallback(
    async (
      file: File,
      metadata: Omit<FileMetadata, "uploadedAt" | "owner" | "status">,
      onStepChange?: (step: UploadStep) => void
    ): Promise<string | null> => {
      if (!fhevm || !signer || !walletClient || !address) {
        toast.error("Wallet not connected");
        return null;
      }

      setIsRegistering(true);
      onStepChange?.("encrypting");

      try {
        // Generate symmetric key
        const symKey = crypto.getRandomValues(new Uint8Array(32));

        // Encrypt file content
        const fileBuffer = await file.arrayBuffer();
        const encryptedFile = await encryptAES(fileBuffer, symKey);

        // Prepare full metadata
        const fullMetadata: FileMetadata = {
          ...metadata,
          uploadedAt: Date.now(),
          owner: address,
          status: "active"
        };

        // Encrypt metadata
        const encryptedMetadata = await encryptAES(
          JSON.stringify(fullMetadata),
          symKey
        );

        // Upload encrypted file to IPFS
        onStepChange?.("uploading");

        const encryptedFileBlob = encryptedToFile(encryptedFile);
        const fileCid = await withRetry(() => uploadToIPFS(encryptedFileBlob));
        const fileCidString = typeof fileCid === "string" ? fileCid : fileCid.toString();

        // Upload encrypted metadata to IPFS
        const metadataBlob = encryptedToFile(encryptedMetadata, "metadata.json");
        const metadataCid = await withRetry(() => uploadToIPFS(metadataBlob));
        const metadataCidString = typeof metadataCid === "string"
          ? metadataCid
          : metadataCid.toString();

        // Register on-chain
        onStepChange?.("registering");

        // Convert AES key to 4×64bit chunks
        const keyChunks = keyToU64Chunks(symKey);

        // Encrypt key chunks with FHE
        const fheInput = fhevm.createEncryptedInput(fileRegistryAddress, address);
        for (const chunk of keyChunks) {
          fheInput.add64(chunk);
        }
        const encryptedKey = await fheInput.encrypt();

        if (!encryptedKey?.handles || encryptedKey.handles.length < 4) {
          throw new Error("FHEVM encryption failed");
        }

        // Generate file ID
        const fileId = ethers.keccak256(
          ethers.toUtf8Bytes(`${address}-${fileCidString}-${Date.now()}`)
        );

        // Call contract
        const contract = await getContract();
        const tx = await contract.registerFile(
          fileId,
          ethers.toUtf8Bytes(fileCidString),
          ethers.toUtf8Bytes(metadataCidString),
          encryptedKey.handles[0],
          encryptedKey.handles[1],
          encryptedKey.handles[2],
          encryptedKey.handles[3],
          encryptedKey.inputProof
        );

        // Wait for confirmation
        const receipt = await waitForTx(tx);

        if (!receipt || receipt.status === 0) {
          throw new Error("Transaction failed");
        }

        onStepChange?.("complete");
        toast.success("File registered successfully!");

        return fileId;

      } catch (error) {
        onStepChange?.("error");

        const message = error instanceof Error ? error.message : "Unknown error";
        if (message.includes("user rejected")) {
          toast.error("Transaction rejected");
        } else {
          toast.error(`Registration failed: ${message}`);
        }

        return null;
      } finally {
        setIsRegistering(false);
      }
    },
    [fhevm, signer, walletClient, address, fileRegistryAddress, getContract]
  );

  /*//////////////////////////////////////////////////////////////
                      BULK UPLOAD
  //////////////////////////////////////////////////////////////*/

  /**
   * Bulk file registration.
   *
   * Strategy for performance:
   *  1. Encrypt all files in parallel (CPU-bound, independent per file)
   *  2. Upload all encrypted blobs to IPFS in parallel (I/O-bound, independent)
   *  3. Register on-chain sequentially (nonce ordering requirement)
   *
   * onFileProgress(index, step) is called as each file advances through
   * its own encrypt → upload → register pipeline.
   */
  const registerFileBulk = useCallback(
    async (
      files: File[],
      metadataList: Omit<FileMetadata, "uploadedAt" | "owner" | "status">[],
      onFileProgress: (index: number, step: UploadStep) => void
    ): Promise<(string | null)[]> => {
      if (!fhevm || !signer || !walletClient || !address) {
        toast.error("Wallet not connected");
        return files.map(() => null);
      }

      // ── Phase 1 & 2: encrypt + IPFS upload in parallel ─────────────────
      type PreparedFile = {
        index: number;
        symKey: Uint8Array;
        fileCidString: string;
        metadataCidString: string;
      };

      const preparedFiles: (PreparedFile | null)[] = await Promise.all(
        files.map(async (file, index) => {
          try {
            onFileProgress(index, "encrypting");

            const symKey = crypto.getRandomValues(new Uint8Array(32));
            const fileBuffer = await file.arrayBuffer();
            const encryptedFile = await encryptAES(fileBuffer, symKey);

            const fullMetadata: FileMetadata = {
              ...metadataList[index],
              uploadedAt: Date.now(),
              owner: address,
              status: "active",
            };
            const encryptedMetadata = await encryptAES(
              JSON.stringify(fullMetadata),
              symKey
            );

            onFileProgress(index, "uploading");

            const encryptedFileBlob = encryptedToFile(encryptedFile);
            const metadataBlob = encryptedToFile(encryptedMetadata, "metadata.json");

            const [fileCid, metadataCid] = await Promise.all([
              withRetry(() => uploadToIPFS(encryptedFileBlob)),
              withRetry(() => uploadToIPFS(metadataBlob)),
            ]);

            return {
              index,
              symKey,
              fileCidString: typeof fileCid === "string" ? fileCid : fileCid.toString(),
              metadataCidString: typeof metadataCid === "string" ? metadataCid : metadataCid.toString(),
            };
          } catch {
            onFileProgress(index, "error");
            return null;
          }
        })
      );

      // ── Phase 3: register on-chain sequentially (nonce safety) ──────────
      const results: (string | null)[] = [];

      for (const prepared of preparedFiles) {
        if (!prepared) {
          results.push(null);
          continue;
        }

        const { index, symKey, fileCidString, metadataCidString } = prepared;
        onFileProgress(index, "registering");

        try {
          const keyChunks = keyToU64Chunks(symKey);
          const fheInput = fhevm.createEncryptedInput(fileRegistryAddress, address);
          for (const chunk of keyChunks) fheInput.add64(chunk);
          const encryptedKey = await fheInput.encrypt();

          if (!encryptedKey?.handles || encryptedKey.handles.length < 4) {
            throw new Error("FHEVM encryption failed");
          }

          const fileId = ethers.keccak256(
            ethers.toUtf8Bytes(`${address}-${fileCidString}-${Date.now()}`)
          );

          const contract = await getContract();
          const tx = await contract.registerFile(
            fileId,
            ethers.toUtf8Bytes(fileCidString),
            ethers.toUtf8Bytes(metadataCidString),
            encryptedKey.handles[0],
            encryptedKey.handles[1],
            encryptedKey.handles[2],
            encryptedKey.handles[3],
            encryptedKey.inputProof
          );

          const receipt = await waitForTx(tx);
          if (!receipt || receipt.status === 0) throw new Error("Transaction failed");

          onFileProgress(index, "complete");
          results.push(fileId);
        } catch (error) {
          onFileProgress(index, "error");
          results.push(null);
        }
      }

      const succeeded = results.filter(Boolean).length;
      if (succeeded === files.length) {
        toast.success(`All ${files.length} files uploaded successfully!`);
      } else if (succeeded > 0) {
        toast.success(`${succeeded} of ${files.length} files uploaded.`);
      } else {
        toast.error("All uploads failed.");
      }

      return results;
    },
    [fhevm, signer, walletClient, address, fileRegistryAddress, getContract]
  );

  const shareFile = useCallback(
    async (
      fileId: string,
      recipient: string,
      symKey: Uint8Array,
      options: ShareOptions = {}
    ): Promise<boolean> => {
      if (!fhevm || !signer || !address) {
        toast.error("Wallet not connected");
        return false;
      }

      if (!ethers.isAddress(recipient)) {
        toast.error("Invalid recipient address");
        return false;
      }

      if (recipient.toLowerCase() === address.toLowerCase()) {
        toast.error("Cannot share with yourself");
        return false;
      }

      let expiresAtUint32 = 0;
      if (options.expiresAt) {
        try {
          expiresAtUint32 = toUint32Timestamp(options.expiresAt);

          const now = Math.floor(Date.now() / 1000);
          if (expiresAtUint32 !== 0 && expiresAtUint32 <= now) {
            toast.error("Expiration must be in the future");
            return false;
          }

          // Validate expiration is within max duration
          if (expiresAtUint32 !== 0 && expiresAtUint32 > now + MAX_EXPIRATION_DURATION) {
            toast.error("Expiration cannot exceed 365 days");
            return false;
          }
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Invalid expiration timestamp");
          return false;
        }
      }

      setIsSharing(true);

      try {
        const keyChunks = keyToU64Chunks(symKey);
        const fheInput = fhevm.createEncryptedInput(fileRegistryAddress, address);
        for (const chunk of keyChunks) {
          fheInput.add64(chunk);
        }
        const encryptedKey = await fheInput.encrypt();

        const contract = await getContract();
        const tx = await contract.shareFile(
          fileId,
          recipient,
          expiresAtUint32,
          encryptedKey.handles[0],
          encryptedKey.handles[1],
          encryptedKey.handles[2],
          encryptedKey.handles[3],
          encryptedKey.inputProof
        );

        const receipt = await waitForTx(tx);

        if (!receipt || receipt.status === 0) {
          throw new Error("Transaction failed");
        }

        toast.success("File shared successfully!");
        return true;

      } catch (error: any) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const errorData = error?.data || error?.error?.data?.data || "";
        const errorString = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);

        if (message.includes("AlreadyShared") || errorString.includes("0x70a4b574") || errorString.includes("70a4b574")) {
          toast.error("File already shared with this recipient. Revoke the existing share first.");
        } else if (message.includes("SelfShare") || errorString.includes("0x0bef78fe") || errorString.includes("0bef78fe")) {
          toast.error("Cannot share file with yourself");
        } else if (message.includes("InvalidExpiration") || errorString.includes("0xfb2a6752") || errorString.includes("fb2a6752")) {
          toast.error("Invalid expiration date. Must be between 1 hour and 365 days.");
        } else if (message.includes("NotFileOwner") || errorString.includes("0xabea3229") || errorString.includes("abea3229")) {
          toast.error("You are not the file owner");
        } else if (message.includes("ZeroAddress") || errorString.includes("0xd92e233d") || errorString.includes("d92e233d")) {
          toast.error("Invalid recipient address");
        } else if (message.includes("FileNotFound") || errorString.includes("0xed20d764") || errorString.includes("ed20d764")) {
          toast.error("File not found");
        } else if (message.includes("ErrFileDeleted") || errorString.includes("0x1d08e3b3") || errorString.includes("1d08e3b3")) {
          toast.error("File has been deleted");
        } else if (message.includes("user rejected") || message.includes("rejected")) {
          toast.error("Transaction rejected");
        } else {
          toast.error(`Share failed: ${message}`);
        }

        return false;
      } finally {
        setIsSharing(false);
      }
    },
    [fhevm, signer, address, fileRegistryAddress, getContract]
  );

  const revokeAccess = useCallback(
    async (fileId: string, recipient: string): Promise<boolean> => {
      if (!signer || !address) {
        toast.error("Wallet not connected");
        return false;
      }

      setIsRevoking(true);

      try {
        const contract = await getContract();
        const tx = await contract.revokeAccess(fileId, recipient);

        const receipt = await waitForTx(tx);

        if (!receipt || receipt.status === 0) {
          throw new Error("Transaction failed");
        }

        toast.success("Access revoked successfully!");
        return true;

      } catch (error: any) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const errorData = error?.data || error?.error?.data?.data || "";
        const errorString = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);

        // NotShared: 0x1f271426, ErrAccessRevoked: 0x4d59c519, NotFileOwner: 0xabea3229
        if (message.includes("NotShared") || errorString.includes("0x1f271426") || errorString.includes("1f271426")) {
          toast.error("File not shared with this recipient");
        } else if (message.includes("ErrAccessRevoked") || errorString.includes("0x4d59c519") || errorString.includes("4d59c519")) {
          toast.error("Access already revoked");
        } else if (message.includes("NotFileOwner") || errorString.includes("0xabea3229") || errorString.includes("abea3229")) {
          toast.error("You are not the file owner");
        } else if (message.includes("user rejected") || message.includes("rejected")) {
          toast.error("Transaction rejected");
        } else {
          toast.error(`Revocation failed: ${message}`);
        }

        return false;
      } finally {
        setIsRevoking(false);
      }
    },
    [signer, address, getContract]
  );

  const extendShareExpiration = useCallback(
    async (
      fileId: string,
      recipient: string,
      newExpiresAt: number
    ): Promise<boolean> => {
      if (!signer || !address) {
        toast.error("Wallet not connected");
        return false;
      }

      let newExpiresAtUint32: number;
      try {
        newExpiresAtUint32 = toUint32Timestamp(newExpiresAt);

        const now = Math.floor(Date.now() / 1000);
        if (newExpiresAtUint32 <= now) {
          toast.error("New expiration must be in the future");
          return false;
        }

        // Validate expiration is within max duration
        if (newExpiresAtUint32 > now + MAX_EXPIRATION_DURATION) {
          toast.error("Expiration cannot exceed 365 days from now");
          return false;
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Invalid expiration timestamp");
        return false;
      }

      try {
        const contract = await getContract();
        const tx = await contract.extendShareExpiration(
          fileId,
          recipient,
          newExpiresAtUint32
        );

        const receipt = await waitForTx(tx);

        if (!receipt || receipt.status === 0) {
          throw new Error("Transaction failed");
        }

        toast.success("Expiration extended successfully!");
        return true;

      } catch (error: any) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const errorData = error?.data || error?.error?.data?.data || "";
        const errorString = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);

        // InvalidExpiration: 0xfb2a6752, NotShared: 0x1f271426, ErrAccessRevoked: 0x4d59c519
        if (message.includes("InvalidExpiration") || errorString.includes("0xfb2a6752") || errorString.includes("fb2a6752")) {
          toast.error("Invalid expiration date. Must be greater than current expiration.");
        } else if (message.includes("NotShared") || errorString.includes("0x1f271426") || errorString.includes("1f271426")) {
          toast.error("File not shared with this recipient");
        } else if (message.includes("ErrAccessRevoked") || errorString.includes("0x4d59c519") || errorString.includes("4d59c519")) {
          toast.error("Cannot extend revoked access");
        } else if (message.includes("user rejected") || message.includes("rejected")) {
          toast.error("Transaction rejected");
        } else {
          toast.error(`Extension failed: ${message}`);
        }

        return false;
      }
    },
    [signer, address, getContract]
  );

  const deleteFile = useCallback(
    async (fileId: string): Promise<boolean> => {
      if (!signer || !address) {
        toast.error("Wallet not connected");
        return false;
      }

      setIsDeleting(true);

      try {
        const contract = await getContract();
        const tx = await contract.deleteFile(fileId);

        const receipt = await waitForTx(tx);

        if (!receipt || receipt.status === 0) {
          throw new Error("Transaction failed");
        }

        toast.success("File deleted successfully!");
        return true;

      } catch (error: any) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const errorData = error?.data || error?.error?.data?.data || "";
        const errorString = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);

        // NotFileOwner: 0xabea3229, ErrFileDeleted: 0x1d08e3b3
        if (message.includes("NotFileOwner") || errorString.includes("0xabea3229") || errorString.includes("abea3229")) {
          toast.error("You are not the file owner");
        } else if (message.includes("ErrFileDeleted") || errorString.includes("0x1d08e3b3") || errorString.includes("1d08e3b3")) {
          toast.error("File already deleted");
        } else if (message.includes("user rejected") || message.includes("rejected")) {
          toast.error("Transaction rejected");
        } else {
          toast.error(`Deletion failed: ${message}`);
        }

        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [signer, address, getContract]
  );

  const updateMetadata = useCallback(
    async (
      fileId: string,
      newMetadata: Omit<FileMetadata, "uploadedAt" | "owner" | "status">,
      symKey: Uint8Array
    ): Promise<boolean> => {
      if (!signer || !address) {
        toast.error("Wallet not connected");
        return false;
      }

      try {
        // Prepare updated metadata
        const updatedMetadata: FileMetadata = {
          ...newMetadata,
          uploadedAt: Date.now(),
          lastModifiedAt: Date.now(),
          owner: address,
          status: "active",
        };

        // Encrypt new metadata
        const encryptedMetadata = await encryptAES(
          JSON.stringify(updatedMetadata),
          symKey
        );

        // Upload to IPFS
        const metadataBlob = encryptedToFile(encryptedMetadata, "metadata.json");
        const metadataCid = await withRetry(() => uploadToIPFS(metadataBlob));
        const metadataCidString =
          typeof metadataCid === "string" ? metadataCid : metadataCid.toString();

        // Call contract
        const contract = await getContract();
        const tx = await contract.updateMetadata(
          fileId,
          ethers.toUtf8Bytes(metadataCidString)
        );

        const receipt = await waitForTx(tx);

        if (!receipt || receipt.status === 0) {
          throw new Error("Transaction failed");
        }

        toast.success("Metadata updated successfully!");
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        if (message.includes("NotFileOwner")) {
          toast.error("You are not the file owner");
        } else if (message.includes("FileDeleted")) {
          toast.error("Cannot update metadata of deleted file");
        } else if (message.includes("user rejected")) {
          toast.error("Transaction rejected");
        } else {
          toast.error(`Metadata update failed: ${message}`);
        }

        return false;
      }
    },
    [signer, address, getContract]
  );

  const requestAccess = useCallback(
    async (fileId: string): Promise<string[] | null> => {
      if (!signer) {
        toast.error("Wallet not connected");
        return null;
      }

      try {
        const contract = await getContract();

        // requestAccess emits an event so it's non-view — staticCall reads the return value without sending a tx
        const result = await contract.requestAccess.staticCall(fileId);

        const handles: string[] = [
          result[0],
          result[1],
          result[2],
          result[3],
        ];

        return handles;

      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        if (message.includes("NoAccess")) {
          toast.error("You don't have access to this file");
        } else if (message.includes("AccessRevoked")) {
          toast.error("Your access has been revoked");
        } else if (message.includes("AccessExpired")) {
          toast.error("Your access has expired");
        } else if (message.includes("FileDeleted")) {
          toast.error("This file has been deleted");
        } else if (message.includes("InvalidNonce")) {
          toast.error("Access was revoked. Please refresh and try again.");
        } else {
          toast.error(`Access request failed: ${message}`);
        }

        return null;
      }
    },
    [signer, getContract]
  );

  const decryptKeyHandles = useCallback(
    async (encryptedHandles: string[]): Promise<Uint8Array | null> => {
      if (!fhevm || status !== "ready" || !address || !signer) {
        toast.error("FHEVM not ready");
        return null;
      }

      if (encryptedHandles.length !== 4) {
        toast.error("Invalid key chunks");
        return null;
      }

      try {
        const signerInstance = await signer;

        const sig = await FhevmDecryptionSignature.loadOrSign(
          fhevm,
          [fileRegistryAddress as `0x${string}`],
          signerInstance,
          fhevmDecryptionSignatureStorage
        );

        if (!sig) {
          throw new Error("Could not sign decryption request");
        }

        const decryptPairs = encryptedHandles.map(handle => ({
          handle,
          contractAddress: fileRegistryAddress
        }));

        const result = await fhevm.userDecrypt(
          decryptPairs,
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        const plaintextChunks = encryptedHandles.map(handle => {
          return result[handle as keyof typeof result] as unknown as bigint;
        });

        const symKey = u64ChunksToKey(plaintextChunks);

        return symKey;

      } catch (error) {
        toast.error("Failed to decrypt key");
        return null;
      }
    },
    [fhevm, status, address, signer, fileRegistryAddress, fhevmDecryptionSignatureStorage]
  );

  const downloadFile = useCallback(
    async (cid: string, symKey: Uint8Array): Promise<Uint8Array | null> => {
      try {
        // Download encrypted file from IPFS
        const encryptedBuffer = await withRetry(() => downloadFromIPFS(cid));

        // Parse encrypted JSON
        const text = new TextDecoder().decode(encryptedBuffer);
        const encryptedJson = JSON.parse(text);

        // Decrypt
        const decrypted = await decryptAES(encryptedJson, symKey);

        return decrypted;

      } catch (error) {
        toast.error("Failed to download file");
        return null;
      }
    },
    []
  );

  const checkAccess = useCallback(
    async (fileId: string, userAddress?: string): Promise<boolean> => {
      if (!signer) return false;

      try {
        const contract = await getContract();
        const hasAccess = await contract.hasAccess(
          fileId,
          userAddress || address
        );

        return hasAccess;

      } catch {
        return false;
      }
    },
    [signer, address, getContract]
  );

  const getShareRecord = useCallback(
    async (fileId: string, recipient: string): Promise<ShareRecord | null> => {
      if (!signer) return null;

      try {
        const contract = await getContract();
        const record = await contract.getShareRecord(fileId, recipient);

        return {
          exists: record.exists,
          sharedAt: Number(record.sharedAt),
          expiresAt: Number(record.expiresAt),
          isRevoked: record.isRevoked,
          isExpired: record.isExpired
        };

      } catch {
        return null;
      }
    },
    [signer, getContract]
  );

  return {
    // Core actions
    registerFile,
    registerFileBulk,
    shareFile,
    revokeAccess,
    extendShareExpiration,
    deleteFile,
    updateMetadata,
    requestAccess,
    decryptKeyHandles,
    downloadFile,

    // Utility functions
    checkAccess,
    getShareRecord,

    // Loading states
    isRegistering,
    isSharing,
    isRevoking,
    isDeleting,

    // Status
    isReady: !!fhevm && status === "ready" && !!address && !!signer
  };
}
