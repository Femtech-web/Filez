import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import {
  FileRegistered,
  FileShared,
  AccessRevoked,
  FileAccessed,
  FileDeleted,
  MetadataUpdated,
  ShareExtended
} from "../generated/FileRegistryV2/FileRegistryV2";
import {
  File,
  Share,
  AccessEvent,
  RevocationEvent,
  User,
  GlobalStats
} from "../generated/schema";

// Helper: Get or create global stats
function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load("global");
  if (!stats) {
    stats = new GlobalStats("global");
    stats.totalFiles = BigInt.fromI32(0);
    stats.activeFiles = BigInt.fromI32(0);
    stats.totalShares = BigInt.fromI32(0);
    stats.activeShares = BigInt.fromI32(0);
    stats.totalRevocations = BigInt.fromI32(0);
    stats.totalUsers = BigInt.fromI32(0);
    stats.lastUpdatedAt = BigInt.fromI32(0);
  }
  return stats;
}

// Helper: Get or create user
function getOrCreateUser(address: Bytes, timestamp: BigInt): User {
  let user = User.load(address.toHexString());
  if (!user) {
    user = new User(address.toHexString());
    user.ownedFileCount = 0;
    user.activeSharesReceived = 0;
    user.firstSeenAt = timestamp;
    user.lastSeenAt = timestamp;

    // Update global user count
    let stats = getOrCreateGlobalStats();
    stats.totalUsers = stats.totalUsers.plus(BigInt.fromI32(1));
    stats.save();
  }
  user.lastSeenAt = timestamp;
  return user;
}

// Helper: Check if share is expired
function isShareExpired(expiresAt: BigInt, currentTimestamp: BigInt): boolean {
  if (expiresAt.equals(BigInt.fromI32(0))) {
    return false; // Never expires
  }
  return currentTimestamp.gt(expiresAt);
}

// Handler: FileRegistered
export function handleFileRegistered(event: FileRegistered): void {
  let fileId = event.params.fileId.toHexString();

  // Create File entity
  let file = new File(fileId);
  file.owner = event.params.owner;
  file.cid = event.params.cid.toString();
  file.metadataCid = event.params.metadataCid.toString();
  file.ownerKeyChunks = changetype<Bytes[]>(event.params.ownerKeyChunks);
  file.createdAt = event.params.timestamp; // ✅ Automatically converts uint32→BigInt
  file.isDeleted = false;
  file.deletedAt = null;
  file.activeShareCount = 0;
  file.totalShareCount = 0;
  file.save();

  // Update owner user
  let owner = getOrCreateUser(event.params.owner, event.params.timestamp);
  owner.ownedFileCount = owner.ownedFileCount + 1;
  owner.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalFiles = stats.totalFiles.plus(BigInt.fromI32(1));
  stats.activeFiles = stats.activeFiles.plus(BigInt.fromI32(1));
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

// Handler: FileShared
// ✅ NO CHANGES NEEDED - Event signature unchanged
export function handleFileShared(event: FileShared): void {
  let fileId = event.params.fileId.toHexString();
  let recipient = event.params.recipient;
  let shareId = fileId + "-" + recipient.toHexString();

  // Load file
  let file = File.load(fileId);
  if (!file) return;

  // Check if this is a re-share (previously revoked)
  let existingShare = Share.load(shareId);
  let isNewShare = existingShare == null || existingShare.isRevoked;

  // Create/Update Share entity
  let share = new Share(shareId);
  share.file = fileId;
  share.owner = event.params.owner;
  share.recipient = recipient;
  share.keyChunks = changetype<Bytes[]>(event.params.keyChunksForRecipient);
  share.sharedAt = event.params.timestamp; // ✅ Automatically converts uint32→BigInt
  share.expiresAt = event.params.expiresAt; // ✅ Automatically converts uint32→BigInt
  share.isRevoked = false;
  share.revokedAt = null;
  share.isExpired = isShareExpired(event.params.expiresAt, event.block.timestamp);
  share.accessCount = 0;
  share.lastAccessedAt = null;
  share.save();

  // Update file share counts
  file.totalShareCount = file.totalShareCount + 1;
  if (isNewShare) {
    file.activeShareCount = file.activeShareCount + 1;
  }
  file.save();

  // Update recipient user
  let recipientUser = getOrCreateUser(recipient, event.params.timestamp);
  if (isNewShare) {
    recipientUser.activeSharesReceived = recipientUser.activeSharesReceived + 1;
  }
  recipientUser.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalShares = stats.totalShares.plus(BigInt.fromI32(1));
  if (isNewShare) {
    stats.activeShares = stats.activeShares.plus(BigInt.fromI32(1));
  }
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

// Handler: AccessRevoked
export function handleAccessRevoked(event: AccessRevoked): void {
  let fileId = event.params.fileId.toHexString();
  let recipient = event.params.recipient;
  let shareId = fileId + "-" + recipient.toHexString();

  // Update Share entity
  let share = Share.load(shareId);
  if (!share) return;

  share.isRevoked = true;
  share.revokedAt = event.params.timestamp;
  share.save();

  // Update file share count
  let file = File.load(fileId);
  if (file) {
    file.activeShareCount = file.activeShareCount - 1;
    file.save();
  }

  // Update recipient user
  let recipientUser = User.load(recipient.toHexString());
  if (recipientUser) {
    recipientUser.activeSharesReceived = recipientUser.activeSharesReceived - 1;
    recipientUser.lastSeenAt = event.params.timestamp;
    recipientUser.save();
  }

  // Create RevocationEvent for audit
  let revocationId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let revocation = new RevocationEvent(revocationId);
  revocation.file = fileId;
  revocation.share = shareId;
  revocation.owner = event.params.owner;
  revocation.recipient = recipient;
  revocation.timestamp = event.params.timestamp;
  revocation.transactionHash = event.transaction.hash;
  revocation.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.activeShares = stats.activeShares.minus(BigInt.fromI32(1));
  stats.totalRevocations = stats.totalRevocations.plus(BigInt.fromI32(1));
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

// Handler: FileAccessed
export function handleFileAccessed(event: FileAccessed): void {
  let fileId = event.params.fileId.toHexString();
  let accessor = event.params.accessor;

  // Load file
  let file = File.load(fileId);
  if (!file) return;

  // Determine if owner or recipient access
  let isOwnerAccess = file.owner.equals(accessor);
  let shareId: string | null = null;

  if (!isOwnerAccess) {
    shareId = fileId + "-" + accessor.toHexString();
    let share = Share.load(shareId!);
    if (share) {
      share.accessCount = share.accessCount + 1;
      share.lastAccessedAt = event.params.timestamp;
      share.save();
    }
  }

  // Create AccessEvent for audit
  let accessEventId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let accessEvent = new AccessEvent(accessEventId);
  accessEvent.file = fileId;
  accessEvent.share = shareId;
  accessEvent.accessor = accessor;
  accessEvent.isOwnerAccess = isOwnerAccess;
  accessEvent.timestamp = event.params.timestamp;
  accessEvent.transactionHash = event.transaction.hash;
  accessEvent.blockNumber = event.block.number;
  accessEvent.save();

  // Update user
  let user = getOrCreateUser(accessor, event.params.timestamp);
  user.save();
}

// Handler: FileDeleted
export function handleFileDeleted(event: FileDeleted): void {
  let fileId = event.params.fileId.toHexString();

  // Update File entity
  let file = File.load(fileId);
  if (!file) return;

  file.isDeleted = true;
  file.deletedAt = event.params.timestamp;
  file.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.activeFiles = stats.activeFiles.minus(BigInt.fromI32(1));
  stats.activeShares = stats.activeShares.minus(BigInt.fromI32(file.activeShareCount));
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

// Handler: MetadataUpdated
export function handleMetadataUpdated(event: MetadataUpdated): void {
  let fileId = event.params.fileId.toHexString();

  let file = File.load(fileId);
  if (!file) return;

  file.metadataCid = event.params.newMetadataCid.toString();
  file.save();
}

// Handler: ShareExtended
export function handleShareExtended(event: ShareExtended): void {
  let fileId = event.params.fileId.toHexString();
  let recipient = event.params.recipient;
  let shareId = fileId + "-" + recipient.toHexString();

  let share = Share.load(shareId);
  if (!share) return;

  share.expiresAt = event.params.newExpiresAt; // ✅ Automatically converts uint32→BigInt
  share.isExpired = false; // Extension means it's no longer expired
  share.save();
}
