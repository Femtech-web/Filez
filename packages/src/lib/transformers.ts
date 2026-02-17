import { FileText } from "lucide-react";
import { shorten } from "./utils";
import type { ActivityEvent } from "@/components/activity-timeline";

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
      time: Number(s.sharedAt || s.timestamp) * 1000,
      type: "share",
    });
  });

  timeline.sort((a, b) => b.time - a.time);

  return timeline;
}

/**
 * Transform subgraph data into ActivityEvent[] for ActivityTimeline component
 */
export function transformActivityEvents(data: any, currentUserAddress: string): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  // File registrations
  if (data.files) {
    data.files.forEach((file: any) => {
      events.push({
        id: `file-registered-${file.id}`,
        type: "file_registered",
        fileId: file.id,
        fileName: `File ${file.id.slice(0, 8)}...`,
        actor: file.owner,
        timestamp: Number(file.createdAt),
        transactionHash: undefined,
      });

      // File deletions
      if (file.isDeleted && file.deletedAt) {
        events.push({
          id: `file-deleted-${file.id}`,
          type: "file_deleted",
          fileId: file.id,
          fileName: `File ${file.id.slice(0, 8)}...`,
          actor: file.owner,
          timestamp: Number(file.deletedAt),
          transactionHash: undefined,
        });
      }
    });
  }

  // Shares created by user (as owner)
  if (data.sharesAsOwner) {
    data.sharesAsOwner.forEach((share: any) => {
      events.push({
        id: `file-shared-${share.id}`,
        type: "file_shared",
        fileId: share.file.id,
        fileName: `File ${share.file.id.slice(0, 8)}...`,
        actor: share.owner,
        recipient: share.recipient,
        timestamp: Number(share.sharedAt),
        transactionHash: undefined,
        metadata: {
          expiresAt: share.expiresAt ? Number(share.expiresAt) : 0,
        },
      });
    });
  }

  // Shares received by user (as recipient)
  if (data.sharesAsRecipient) {
    data.sharesAsRecipient.forEach((share: any) => {
      // Only add if not already added from sharesAsOwner
      const alreadyAdded = events.some(e => e.id === `file-shared-${share.id}`);
      if (!alreadyAdded) {
        events.push({
          id: `file-shared-${share.id}`,
          type: "file_shared",
          fileId: share.file.id,
          fileName: `File ${share.file.id.slice(0, 8)}...`,
          actor: share.owner,
          recipient: share.recipient,
          timestamp: Number(share.sharedAt),
          transactionHash: undefined,
          metadata: {
            expiresAt: share.expiresAt ? Number(share.expiresAt) : 0,
          },
        });
      }
    });
  }

  // Access events
  if (data.accessEvents) {
    data.accessEvents.forEach((event: any) => {
      events.push({
        id: event.id,
        type: "file_accessed",
        fileId: event.file.id,
        fileName: `File ${event.file.id.slice(0, 8)}...`,
        actor: event.accessor,
        timestamp: Number(event.timestamp),
        transactionHash: event.transactionHash,
        metadata: {
          isOwnerAccess: event.isOwnerAccess,
        },
      });
    });
  }

  // Revocations by user (as owner)
  if (data.revocationsAsOwner) {
    data.revocationsAsOwner.forEach((revocation: any) => {
      events.push({
        id: revocation.id,
        type: "access_revoked",
        fileId: revocation.file.id,
        fileName: `File ${revocation.file.id.slice(0, 8)}...`,
        actor: revocation.owner,
        recipient: revocation.recipient,
        timestamp: Number(revocation.timestamp),
        transactionHash: revocation.transactionHash,
      });
    });
  }

  // Revocations affecting user (as recipient)
  if (data.revocationsAsRecipient) {
    data.revocationsAsRecipient.forEach((revocation: any) => {
      // Only add if not already added from revocationsAsOwner
      const alreadyAdded = events.some(e => e.id === revocation.id);
      if (!alreadyAdded) {
        events.push({
          id: revocation.id,
          type: "access_revoked",
          fileId: revocation.file.id,
          fileName: `File ${revocation.file.id.slice(0, 8)}...`,
          actor: revocation.owner,
          recipient: revocation.recipient,
          timestamp: Number(revocation.timestamp),
          transactionHash: revocation.transactionHash,
        });
      }
    });
  }

  // Sort by timestamp descending (newest first)
  events.sort((a, b) => b.timestamp - a.timestamp);

  return events;
}

/**
 * Transform file activity data for a specific file
 */
export function transformFileActivityEvents(data: any): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  if (!data || !data.file) return events;

  const fileId = data.file.id;
  const fileName = `File ${fileId.slice(0, 8)}...`;

  // File registration
  events.push({
    id: `file-registered-${fileId}`,
    type: "file_registered",
    fileId,
    fileName,
    actor: data.file.owner,
    timestamp: Number(data.file.createdAt),
  });

  // Shares
  if (data.shares) {
    data.shares.forEach((share: any) => {
      events.push({
        id: `file-shared-${share.id}`,
        type: "file_shared",
        fileId,
        fileName,
        actor: share.owner,
        recipient: share.recipient,
        timestamp: Number(share.sharedAt),
        metadata: {
          expiresAt: share.expiresAt ? Number(share.expiresAt) : 0,
        },
      });

      // Revocation
      if (share.isRevoked && share.revokedAt) {
        events.push({
          id: `access-revoked-${share.id}`,
          type: "access_revoked",
          fileId,
          fileName,
          actor: share.owner,
          recipient: share.recipient,
          timestamp: Number(share.revokedAt),
        });
      }
    });
  }

  // Access events
  if (data.accessEvents) {
    data.accessEvents.forEach((event: any) => {
      events.push({
        id: event.id,
        type: "file_accessed",
        fileId,
        fileName,
        actor: event.accessor,
        timestamp: Number(event.timestamp),
        transactionHash: event.transactionHash,
        metadata: {
          isOwnerAccess: event.isOwnerAccess,
        },
      });
    });
  }

  // Revocation events
  if (data.revocationEvents) {
    data.revocationEvents.forEach((event: any) => {
      // Only add if not already added from shares
      const alreadyAdded = events.some(e => e.id === event.id);
      if (!alreadyAdded) {
        events.push({
          id: event.id,
          type: "access_revoked",
          fileId,
          fileName,
          actor: event.owner,
          recipient: event.recipient,
          timestamp: Number(event.timestamp),
          transactionHash: event.transactionHash,
        });
      }
    });
  }

  // Sort by timestamp descending
  events.sort((a, b) => b.timestamp - a.timestamp);

  return events;
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
    sharedAt: s.sharedAt,

    name: `shared-${s.file.id.slice(2, 8)}.enc`,
    type: "encrypted",
    icon: FileText,
    size: "Encrypted",
    uploadedAt: new Date(Number(s.sharedAt) * 1000).toLocaleString(),

    encrypted: true,
    onChain: true,
  };
}
