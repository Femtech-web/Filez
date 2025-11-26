import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function keyToU64Chunks(keyBytes: Uint8Array): bigint[] {
  if (keyBytes.length !== 32) {
    throw new Error("Key must be 32 bytes");
  }

  const chunks: bigint[] = [];

  for (let i = 0; i < 4; i++) {
    const slice = keyBytes.subarray(i * 8, i * 8 + 8);
    let v = 0n;

    for (let b = 0; b < 8; b++) {
      v = (v << 8n) + BigInt(slice[b]);
    }
    chunks.push(v);
  }

  return chunks;
}

export function u64ChunksToKey(chunks: Array<number | bigint>): Uint8Array {
  if (chunks.length !== 4) {
    throw new Error("Need exactly 4 chunks");
  }

  const out = new Uint8Array(32);

  for (let i = 0; i < 4; i++) {
    let v = BigInt(chunks[i]);

    for (let b = 7; b >= 0; b--) {
      out[i * 8 + b] = Number(v & 0xffn);
      v >>= 8n;
    }
  }

  return out;
}

export function shorten(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || isNaN(bytes)) return "_";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let i = 0;

  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }

  return `${size.toFixed(2)} ${units[i]}`;
}
