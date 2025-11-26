import { ethers, SigningKey } from "ethers";

// ---------- HELPERS ----------

function toBuf(arr: Uint8Array | ArrayBuffer): ArrayBuffer {
  if (arr instanceof ArrayBuffer) return arr;

  const view = new Uint8Array(arr);
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

function forceArrayBuffer(data: ArrayBuffer | ArrayBufferLike | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return data;
  }

  const view = data instanceof Uint8Array ? data : new Uint8Array(data);
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer; // always a clean ArrayBuffer
}

function forceUint8(data: ArrayBuffer | ArrayBufferLike | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(forceArrayBuffer(data));
}

export function encryptedToFile(enc: { iv: string; cipher: string }, fileName = "encrypted.json"): File {
  const json = JSON.stringify(enc);
  return new File([json], fileName, { type: "application/json" });
}

// ---------- AES ENCRYPT ----------
export async function encryptAES(
  data: ArrayBuffer | string,
  key: Uint8Array
) {
  const cleanKey = await crypto.subtle.importKey(
    "raw",
    forceArrayBuffer(key),
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encoded =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : forceUint8(data);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cleanKey,
    forceArrayBuffer(encoded)
  );

  return {
    iv: Buffer.from(iv).toString("hex"),
    cipher: Buffer.from(new Uint8Array(ciphertext)).toString("hex"),
  };
}


// ---------- AES DECRYPT ----------
export async function decryptAES(
  encrypted: { iv: string; cipher: string },
  key: Uint8Array
) {
  const cleanKey = await crypto.subtle.importKey(
    "raw",
    forceArrayBuffer(key),
    "AES-GCM",
    false,
    ["decrypt"]
  );

  const iv = Uint8Array.from(Buffer.from(encrypted.iv, "hex"));
  const cipherBytes = Uint8Array.from(Buffer.from(encrypted.cipher, "hex"));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cleanKey,
    forceArrayBuffer(cipherBytes)
  );

  return new Uint8Array(decrypted);
}


// ---------- ECDH (ethers v6 way) ----------
async function deriveSharedKey(
  recipientPubKeyHex: string,
  senderPrivKeyHex: string
) {
  const sender = new SigningKey(senderPrivKeyHex);
  const sharedSecret = sender.computeSharedSecret(recipientPubKeyHex);

  // sharedSecret is a hex string
  return Uint8Array.from(Buffer.from(sharedSecret.slice(2), "hex")).slice(
    0,
    32
  );
}

// ---------- WRAP KEY FOR USER ----------
export async function wrapKeyForUser(
  symmetricKey: Uint8Array,
  recipientAddress: string
) {
  // ephemeral private key
  const ephPriv = ethers.hexlify(ethers.randomBytes(32));
  const eph = new SigningKey(ephPriv);
  const ephPub = eph.publicKey; // v6 OK

  const provider = new ethers.BrowserProvider((window as any).ethereum);

  // metamask-style encryption public key
  const pubKeyBase64 = await provider.send(
    "eth_getEncryptionPublicKey",
    [recipientAddress]
  );

  const recipientPubKey = Buffer.from(pubKeyBase64, "base64").toString("hex");

  // derive shared secret
  const shared = await deriveSharedKey(`0x${recipientPubKey}`, ephPriv);

  // encrypt symmetric key with shared secret
  const aesKey = await crypto.subtle.importKey(
    "raw",
    toBuf(shared),
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    toBuf(symmetricKey)
  );

  return ethers.hexlify(
    ethers.concat([ethers.getBytes(ephPub), iv, new Uint8Array(cipher)])
  );
}

// ---------- UNWRAP KEY ----------
export async function unwrapKey(wrappedHex: string, userAddress: string) {
  const wrapped = ethers.getBytes(wrappedHex);

  const ephPub = wrapped.slice(0, 65);
  const iv = wrapped.slice(65, 77);
  const cipher = wrapped.slice(77);

  const provider = new ethers.BrowserProvider((window as any).ethereum);

  // user decrypts private key with wallet
  const encryptedPriv = await provider.send(
    "eth_getEncryptionPublicKey",
    [userAddress]
  );

  const privHex = await provider.send("eth_decrypt", [
    encryptedPriv,
    userAddress,
  ]);

  const shared = await deriveSharedKey(
    ethers.hexlify(ephPub),
    `0x${privHex}`
  );

  const aesKey = await crypto.subtle.importKey(
    "raw",
    toBuf(shared),
    "AES-GCM",
    false,
    ["decrypt"]
  );

  const symPlain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    cipher
  );

  return new Uint8Array(symPlain);
}
