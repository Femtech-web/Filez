import { FileText } from "lucide-react";
import { shorten } from "./utils";

export function buildTimeline(activity: any, fileId: string) {
  if (!activity || !activity.file) return [];

  const timeline = [];

  timeline.push({
    action: "File uploaded",
    time: Number(activity.file.createdAt) * 1000,
    type: "upload",
  });

  timeline.push({
    action: "Encrypted on-chain",
    time: Number(activity.file.createdAt) * 1000,
    type: "encrypt",
  });

  activity.shares.forEach((s: any) => {
    timeline.push({
      action: `Shared with ${shorten(s.recipient)}`,
      time: Number(s.timestamp) * 1000,
      type: "share",
    });
  });

  timeline.sort((a, b) => b.time - a.time);

  return timeline;
}


export function transformOnchainFile(f: any) {
  const cid = f.cid;
  const metaCid = f.metadataCid;

  return {
    id: f.id,

    name: metaCid ? `file-${f.id.slice(2, 8)}.enc` : "encrypted-file.enc",

    type: "encrypted",
    icon: FileText,

    size: "Encrypted",
    cid: cid,
    metadataCid: metaCid,

    uploadedAt: new Date(Number(f.createdAt) * 1000).toLocaleString(),

    encrypted: true,
    onChain: true,
  };
}

export function transformSharedFile(s: any) {
  return {
    id: s.id,
    fileId: s.file.id,
    owner: s.owner,
    recipient: s.recipient,
    keyChunks: s.keyChunks,
    timestamp: s.timestamp,

    name: `shared-${s.file.id.slice(2, 8)}.enc`,
    type: "encrypted",
    icon: FileText,
    size: "Encrypted",
    uploadedAt: new Date(Number(s.timestamp) * 1000).toLocaleString(),

    encrypted: true,
    onChain: true,
  };
}
