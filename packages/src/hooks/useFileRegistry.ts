"use client";

import { useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useFhevmContext } from "@/providers/fhevmProvider";
import { useEthersSigner } from "@/hooks/useEthersSigner";
import { toast } from "sonner";
import { ethers } from "ethers";
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


export function useFileRegistry(fileRegistryAddress: string) {
  const { address } = useAccount();
  const { instance: fhevm, status } = useFhevmContext();
  const { signer } = useEthersSigner();
  const { data: walletClient } = useWalletClient();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();


  const registerFile = useCallback(
    async (file: File, metadata: any, setUploadStep: any) => {
      if (!fhevm || !signer || !walletClient || !address) {
        console.error("Missing fhevm/signer/wallet/address", { fhevm, signer, walletClient, address });
        return;
      }

      try {
        // Generate symmetric key
        const symKey = crypto.getRandomValues(new Uint8Array(32));

        // AES encrypt file and metadata 
        const encryptedFile = await encryptAES(await file.arrayBuffer(), symKey);
        const encMetadata = await encryptAES(JSON.stringify(metadata), symKey);

        // Upload encrypted file to IPFS 
        const encryptedFileBlob = encryptedToFile(encryptedFile);
        setUploadStep("uploading");
        const cidObj = await uploadToIPFS(encryptedFileBlob);

        // Convert CID to string 
        const cidString = typeof cidObj === "string" ? cidObj : cidObj.toString();

        // Upload metadata separately
        const metadataBlob = encryptedToFile(encMetadata, "metadata.json");
        const metaCidObj = await uploadToIPFS(metadataBlob);
        const metaCidString = typeof metaCidObj === "string" ? metaCidObj : metaCidObj.toString();

        const metaCidBytes = ethers.toUtf8Bytes(metaCidString);

        //  Convert AES key to 4×64bit chunks
        const chunks = keyToU64Chunks(symKey);

        const targetContract = ethers.getAddress(fileRegistryAddress);
        const userAddr = ethers.getAddress(address);

        if (!fhevm) throw new Error("FHEVM instance not available");

        setUploadStep("registering");
        const inputKey = fhevm.createEncryptedInput(fileRegistryAddress, address);
        for (const c of chunks) inputKey.add64(c);
        const encKey = await inputKey.encrypt();

        if (!encKey?.handles || encKey.handles.length < 4) {
          throw new Error("FHEVM returned unexpected handles: " + JSON.stringify(encKey));
        }

        const fileId = ethers.keccak256(
          ethers.toUtf8Bytes(`${userAddr}-${cidString}-${Date.now()}`)
        );

        const contract = new ethers.Contract(
          targetContract,
          ABIS.FileRegistry,
          await signer
        );

        const cidBytes = ethers.toUtf8Bytes(cidString);
        const tx = await contract.registerFile(
          fileId,
          cidBytes,
          metaCidBytes,
          encKey.handles[0],
          encKey.handles[1],
          encKey.handles[2],
          encKey.handles[3],
          encKey.inputProof
        );


        tx.wait()
        toast.success("File registered successfully!");
        setUploadStep("complete");
        return fileId;
      } catch (err) {
        console.error("registerFile error:", err);
        toast.error("File registration failed.");
      }
    },
    [fhevm, signer, walletClient, address, fileRegistryAddress]
  );


  // SHARE FILE WITH RECIPIENT
  const shareFile = useCallback(
    async (fileId: string, recipient: string, symKey: Uint8Array) => {
      if (!fhevm || !signer || !address) return;

      try {
        // convert key to chunks
        const chunks = keyToU64Chunks(symKey);

        // encrypt for recipient
        const input = fhevm.createEncryptedInput(fileRegistryAddress, address);
        for (const c of chunks) input.add64(c);
        const enc = await input.encrypt();

        const contract = new ethers.Contract(
          fileRegistryAddress,
          ABIS.FileRegistry,
          await signer
        );

        await contract.shareFileWith(
          fileId,
          recipient,
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.handles[3],
          enc.inputProof
        );

        toast.success("File shared!");
      } catch (err) {
        console.error("shareFile error:", err);
        toast.error("Share failed.");
      }
    },
    [fhevm, signer, address]
  );


  // REQUEST ACCESS (recipient receives encrypted 4 handles)
  const requestAccess = useCallback(
    async (fileId: string) => {
      if (!signer) return;

      try {
        const contract = new ethers.Contract(
          fileRegistryAddress,
          ABIS.FileRegistry,
          await signer
        );

        const handles: string[] = await contract.requestAccess(fileId);

        toast.success("Encrypted key chunks retrieved");
        return handles;

      } catch (err) {
        console.error("requestAccess error:", err);
        toast.error("Request failed.");
      }
    },
    [signer]
  );


  // DECRYPT HANDLES (recipient decrypts 4 chunks to AES key)
  const decryptKeyHandle = useCallback(
    async (encryptedHandles: string[]) => {
      if (!fhevm || status !== "ready" || !address || !signer) {
        toast.error("FHEVM not ready");
        return;
      }

      if (encryptedHandles.length !== 4) {
        toast.error("Invalid chunks");
        return;
      }

      const signerObj = await signer;

      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevm,
        [fileRegistryAddress as `0x${string}`],
        signerObj,
        fhevmDecryptionSignatureStorage
      );

      if (!sig) {
        toast.error("Could not sign decryption request");
        return;
      }

      const decryptPairs = encryptedHandles.map(h => ({
        handle: h,
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

      // Extract each chunk
      const plaintextChunks = encryptedHandles.map(h => {
        const key = h as any;
        return result[key] as unknown as any;
      });

      // Convert chunks to actual Uint8Array key
      const symKey = u64ChunksToKey(plaintextChunks);

      return symKey;
    },
    [fhevm, status, address, signer]
  );


  //  DECRYPT and DOWNLOAD FILE
  const downloadFile = useCallback(
    async (cid: string, symKey: Uint8Array) => {
      try {
        const encryptedBuffer = await downloadFromIPFS(cid);

        // Convert ArrayBuffer to text
        const text = new TextDecoder().decode(encryptedBuffer);

        const encryptedJson = JSON.parse(text);

        return await decryptAES(encryptedJson, symKey);

      } catch (err) {
        console.error("downloadFile error:", err);
        toast.error("Failed to decrypt file.");
      }
    },
    []
  );

  return {
    registerFile,
    shareFile,
    requestAccess,
    decryptKeyHandle,
    downloadFile,
  };
}
