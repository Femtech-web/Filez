# Revocation Feature & Share Improvements

**Date:** 2026-02-16
**Status:** ✅ Complete

---

## 🔴 Critical Bug Fixed: Invalid Chunk Error

### The Problem
When sharing files in V2, recipients were getting "invalid chunk" errors when trying to open shared files.

### Root Cause
In [useFileRegistry.ts:628](../src/hooks/useFileRegistry.ts#L628), the `shareFile` function was encrypting the AES key chunks with the **owner's address** instead of the **recipient's address**:

```typescript
// ❌ WRONG - Encrypts for owner
const fheInput = fhevm.createEncryptedInput(fileRegistryAddress, address);
```

### The Fix
Changed to encrypt for the recipient's address:

```typescript
// ✅ CORRECT - Encrypts for recipient
const fheInput = fhevm.createEncryptedInput(fileRegistryAddress, recipient);
```

### Why This Matters
FHE (Fully Homomorphic Encryption) creates ciphertexts that can **only be decrypted by a specific address**. When you encrypt with the owner's address, only the owner can decrypt the chunks. The recipient receives these encrypted chunks but cannot decrypt them because they were encrypted for the wrong address.

**This is why V1 worked but V2 didn't** - V1 uses a different encryption method without this address-specific restriction.

---

## 🎯 Access Revocation Feature

### Overview
The revocation feature allows file owners to revoke access to previously shared files. This is a core V2 contract feature.

### Implementation Details

#### 1. **Contract Function**
Located in `file-registry-v2.sol`:

```solidity
function revokeAccess(bytes32 fileId, address recipient)
    external
    nonReentrant
    onlyFileOwner(fileId)
    fileActive(fileId)
{
    ShareRecord storage share = shares[fileId][recipient];
    require(share.sharedAt > 0, "NotShared");
    require(!share.isRevoked, "AccessRevoked");

    share.isRevoked = true;

    emit AccessRevoked(fileId, msg.sender, recipient, block.timestamp);
}
```

**Access Control:**
- Only file owner can revoke
- File must be active (not deleted)
- Share must exist and not already revoked

---

#### 2. **Frontend Hook**
Located in [useFileRegistry.ts:682-726](../src/hooks/useFileRegistry.ts#L682-L726):

```typescript
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

    } catch (error) {
      console.error("revokeAccess error:", error);

      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("NotShared")) {
        toast.error("File not shared with this recipient");
      } else if (message.includes("AccessRevoked")) {
        toast.error("Access already revoked");
      } else if (message.includes("NotFileOwner")) {
        toast.error("You are not the file owner");
      } else if (message.includes("user rejected")) {
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
```

**Error Handling:**
- NotShared - File not shared with this recipient
- AccessRevoked - Access already revoked
- NotFileOwner - User is not the file owner
- User rejected transaction

---

#### 3. **Subgraph Tracking**
The `AccessRevoked` event is tracked by the subgraph and creates a `RevocationEvent` entity.

**Query to get revocations for a file:**
```graphql
query FileActivity($id: ID!) {
  revocationEvents(where: { file: $id }, orderBy: timestamp, orderDirection: desc) {
    id
    owner
    recipient
    timestamp
    transactionHash
  }
}
```

**Available in:**
- `GET_FILE_ACTIVITY` - Revocations for a specific file
- `GET_USER_ACTIVITY` - All revocations involving a user (as owner or recipient)

---

#### 4. **Where Revocation Can Be Used**

Currently, the revocation feature hook exists but **no UI component is integrated yet**. Here's where it should be added:

##### **Option A: File Detail Page - Shares List** (Recommended)

Add a shares management section to [file/[id]/page.tsx](../src/app/file/[id]/page.tsx):

```tsx
import { useFileRegistry } from "@/hooks/useFileRegistry";

// In component:
const { revokeAccess, isRevoking } = useFileRegistry(FILE_REGISTRY_ADDRESS);

// Fetch shares from activity data:
const shares = activity?.shares || [];

// Render shares list:
<div className="bg-card border border-border rounded-2xl p-6">
  <h2 className="text-lg font-semibold text-foreground mb-4">Active Shares</h2>

  {shares.filter(s => !s.isRevoked && !s.isExpired).map(share => (
    <div key={share.id} className="flex items-center justify-between p-3 border-b">
      <div>
        <p className="font-mono text-sm">{shorten(share.recipient)}</p>
        <p className="text-xs text-muted-foreground">
          Shared {formatDistanceToNow(new Date(share.sharedAt * 1000))} ago
        </p>
        {share.expiresAt > 0 && (
          <p className="text-xs text-orange-400">
            Expires {new Date(share.expiresAt * 1000).toLocaleString()}
          </p>
        )}
      </div>

      <button
        onClick={async () => {
          const success = await revokeAccess(fileId, share.recipient);
          if (success) {
            // Refetch activity
            mutate();
          }
        }}
        disabled={isRevoking}
        className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 disabled:opacity-50"
      >
        {isRevoking ? "Revoking..." : "Revoke"}
      </button>
    </div>
  ))}

  {shares.filter(s => !s.isRevoked && !s.isExpired).length === 0 && (
    <p className="text-sm text-muted-foreground text-center py-4">
      No active shares
    </p>
  )}
</div>
```

##### **Option B: Dashboard Page - Shared Files Section**

Add revoke buttons next to shared files in the dashboard:

```tsx
{myFiles.map(file => (
  <FileCard
    key={file.id}
    file={file}
    actions={
      <button onClick={() => openSharesModal(file.id)}>
        Manage Shares ({file.activeShareCount})
      </button>
    }
  />
))}
```

##### **Option C: Dedicated Shares Management Modal**

Create a new `SharesManagementModal` component:

```tsx
<SharesManagementModal
  isOpen={isSharesModalOpen}
  onClose={() => setIsSharesModalOpen(false)}
  fileId={fileId}
  shares={shares}
  onRevoke={async (recipient) => {
    const success = await revokeAccess(fileId, recipient);
    if (success) refetchShares();
  }}
  onExtend={async (recipient, newExpiresAt) => {
    const success = await extendShareExpiration(fileId, recipient, newExpiresAt);
    if (success) refetchShares();
  }}
/>
```

---

## 🆕 Custom Date/Time Picker for Share Expiration

### Problem
The original ShareModal only had 8 fixed expiration options (Never, 1 Hour, 1 Day, 1 Week, 1 Month, 3 Months, 6 Months, 1 Year). Users couldn't set custom expiration times.

### Solution
Added a custom date & time picker that allows users to:
- Set **any expiration date** (not limited to preset options)
- Set **specific time** down to the minute
- Toggle between quick options and custom picker

### Implementation

#### New State Variables
```typescript
const [customDate, setCustomDate] = React.useState("");
const [customTime, setCustomTime] = React.useState("");
const [useCustomDateTime, setUseCustomDateTime] = React.useState(false);
```

#### Updated Timestamp Calculation
```typescript
const expiresAtTimestamp = React.useMemo(() => {
  if (useCustomDateTime) {
    if (!customDate || !customTime) return undefined;
    const dateTime = new Date(`${customDate}T${customTime}`);
    return Math.floor(dateTime.getTime() / 1000);
  }
  if (selectedExpiration === 0) return undefined;
  return Math.floor(Date.now() / 1000) + selectedExpiration;
}, [selectedExpiration, useCustomDateTime, customDate, customTime]);
```

#### UI Features
- **Toggle Button:** Switch between quick options and custom picker
- **Date Input:** HTML5 date picker with minimum date = today
- **Time Input:** HTML5 time picker for precise control
- **Live Preview:** Shows selected expiration in human-readable format
- **Validation:** Ensures custom date/time is in the future

### Usage Example

**Quick Options (Default):**
```
[ Never ]  [ 1 Hour ]  [ 1 Day ]  [ 1 Week ]
[ 1 Month ] [ 3 Months ] [ 6 Months ] [ 1 Year ]
```

**Custom Date/Time:**
```
Date: [2026-03-15]  Time: [14:30]
Expires on: Mar 15, 2026, 2:30 PM
```

### Benefits
1. ✅ **Flexibility** - Set any expiration date/time
2. ✅ **Precision** - Control down to the minute
3. ✅ **User-Friendly** - Simple toggle between modes
4. ✅ **No Code Changes** - Works with existing contract (accepts unix timestamps)

---

## 📊 Complete Share Management Features

### File Owner Actions
| Action | Hook | UI Status |
|--------|------|-----------|
| Share file with expiration | `shareFile()` | ✅ ShareModal |
| Extend share expiration | `extendShareExpiration()` | ✅ ExtendExpirationModal |
| Revoke access | `revokeAccess()` | ⚠️ Hook exists, UI needed |
| View active shares | Subgraph query | ⚠️ Query exists, UI needed |

### Recipient Actions
| Action | Hook | UI Status |
|--------|------|-----------|
| Request access | `requestAccess()` | ✅ File Detail Page |
| View shared files | `GET_SHARED_WITH_ME` | ✅ Dashboard |
| Download shared file | `downloadFile()` | ✅ File Detail Page |

---

## 🎯 Recommended Next Steps

### 1. Add Shares List to File Detail Page
**Priority:** High
**Effort:** Medium

Add a "Active Shares" section showing:
- Recipient addresses
- Share timestamp
- Expiration time (if set)
- Revoke button for each share
- Extend button for each share

### 2. Create Shares Management Modal
**Priority:** Medium
**Effort:** Medium

Consolidated modal for managing all shares of a file:
- List all shares (active, revoked, expired)
- Bulk revoke option
- Bulk extend option
- Share analytics (access count, last accessed)

### 3. Add Share Notifications
**Priority:** Low
**Effort:** Low

Show toast notifications when:
- Someone accesses your shared file
- A share is about to expire (24h warning)
- A share has expired

---

## 🔒 Security Considerations

### Revocation
- ✅ Only file owner can revoke
- ✅ Cannot revoke non-existent shares
- ✅ Cannot revoke already-revoked shares
- ✅ Revoked access is permanent (cannot un-revoke)

### Share Expiration
- ✅ Expiration timestamps validated on-chain
- ✅ uint32 used for gas optimization (valid until year 2106)
- ✅ Maximum expiration: 365 days from now
- ✅ Contract enforces expiration on `requestAccess`

### FHE Encryption
- ✅ Key chunks encrypted for specific recipient address
- ✅ Only recipient can decrypt their key chunks
- ✅ Revoked users cannot access FHE-encrypted chunks on-chain

---

## 📝 Summary

### Bugs Fixed
1. ✅ **Invalid chunk error** - Fixed FHE encryption to use recipient address

### Features Added
1. ✅ **Custom date/time picker** - Full control over share expiration
2. ✅ **Toggle between quick options and custom** - Best of both worlds

### Features Available (Need UI Integration)
1. ⚠️ **Access revocation** - Hook exists, needs UI component
2. ⚠️ **Shares list view** - Query exists, needs rendering

### Recommended Integrations
1. Add shares list to File Detail Page
2. Add revoke buttons to shares list
3. Consider creating dedicated Shares Management Modal

---

**Generated:** 2026-02-16
**FileZ V2 Status:** ✅ Bug Fixed, Enhanced Share Experience
