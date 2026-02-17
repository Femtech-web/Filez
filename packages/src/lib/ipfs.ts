
import * as Client from "@storacha/client";
import { StoreMemory } from "@storacha/client/stores/memory";
import * as Proof from "@storacha/client/proof";
import { Signer } from "@storacha/client/principal/ed25519";

async function getStorachaClient() {
  const key = process.env.NEXT_PUBLIC_STORACHA_KEY;
  const proofStr = process.env.NEXT_PUBLIC_STORACHA_PROOF;

  if (!key) throw new Error("Missing NEXT_PUBLIC_STORACHA_KEY");
  if (!proofStr) throw new Error("Missing NEXT_PUBLIC_STORACHA_PROOF");

  const principal = Signer.parse(key);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });

  const proof = await Proof.parse(proofStr);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  return client;
}

export async function uploadToIPFS(data: File) {
  try {
    const client = await getStorachaClient();

    const cid = await client.uploadFile(data);

    return cid;
  } catch (err) {
    throw err;
  }
}

export async function downloadFromIPFS(cid: string): Promise<ArrayBuffer> {
  try {
    const url = `https://${cid}.ipfs.storacha.link`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gateway error: ${res.status}`);

    const blob = await res.blob();
    return await blob.arrayBuffer();
  } catch (err) {
    throw err;
  }
}

