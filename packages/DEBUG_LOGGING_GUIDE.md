# Debug Logging Guide

**Date:** 2026-02-16
**Purpose:** Comprehensive logging to diagnose share failures

---

## 🔍 Overview

We've added detailed console logging throughout the share file flow to help identify exactly where and why sharing is failing.

---

## 📊 Logging Locations

### 1. ShareModal Component

**File:** [src/components/share-modal.tsx](src/components/share-modal.tsx)

**Logs:**

```
🚀 [ShareModal] Starting share process
  - fileId
  - fileName
  - recipient address
  - current user (owner)
  - expiration timestamp
  - expiration date (human readable)

👤 [ShareModal] User role
  - isOwner (boolean)
  - owner address
  - current user address

🔑 [ShareModal] Retrieved encrypted chunks
  - method (direct/requestAccess)
  - hasChunks (boolean)
  - chunk count

🔓 [ShareModal] Decrypting key chunks...

✅ [ShareModal] Key decryption complete
  - hasKey (boolean)
  - key length

📤 [ShareModal] Calling shareFile...

📊 [ShareModal] shareFile result
  - success (boolean)

🎉 [ShareModal] Share complete, showing success screen

❌ [ShareModal] Error in handleShare
  - full error object
  - error message
  - stack trace
```

---

### 2. useFileRegistry Hook - shareFile Function

**File:** [src/hooks/useFileRegistry.ts](src/hooks/useFileRegistry.ts)

**Logs:**

```
🔄 [shareFile] Starting share process
  - fileId
  - recipient
  - owner
  - expiresAt timestamp

✅ [shareFile] Expiration converted
  - original timestamp
  - uint32 converted value
  - human-readable date

ℹ️ [shareFile] No expiration set (never expires)

✅ [shareFile] Symmetric key converted to chunks
  - chunk count (should be 4)
  - first 8 chars of each chunk

🔐 [shareFile] Creating FHE encrypted input for recipient
  - recipient address

✅ [shareFile] FHE encryption complete
  - handle count (should be 4)
  - first 10 chars of each handle
  - has proof (boolean)
  - proof length

📝 [shareFile] Calling contract.shareFile with params
  - fileId
  - recipient
  - expiresAt (uint32)
  - handle count

⏳ [shareFile] Transaction sent, waiting for confirmation
  - transaction hash

✅ [shareFile] Transaction confirmed
  - block number
  - status
  - gas used

🎉 [shareFile] Share successful!

❌ [shareFile] Error occurred
  - full error object
  - error message
  - error code
  - error.data
  - error.error.data
  - error.error.data.data (nested)

🔍 [shareFile] Error analysis
  - message
  - errorData
  - errorString (first 200 chars)

🔍 [shareFile] Detected: [ErrorType] error
  - Shows which specific error was detected
```

---

### 3. useFileRegistry Hook - getContract Function

**File:** [src/hooks/useFileRegistry.ts](src/hooks/useFileRegistry.ts)

**Logs:**

```
✅ [getContract] Contract instance created
  - contract address
  - signer address
  - network details (chainId, name)
```

---

## 🎯 How to Use These Logs

### Step 1: Open Browser Console

1. Open your browser (Chrome/Firefox/Safari)
2. Press `F12` or `Right Click → Inspect`
3. Go to the **Console** tab
4. Clear existing logs (trash icon)

### Step 2: Attempt to Share a File

1. Navigate to a file detail page
2. Click "Share File" button
3. Enter recipient address
4. Select expiration (or custom)
5. Click "Share"

### Step 3: Read the Logs in Order

Follow the log sequence to identify where the failure occurs:

#### ✅ Expected Success Flow:

```
🚀 [ShareModal] Starting share process
👤 [ShareModal] User role
🔑 [ShareModal] Retrieved encrypted chunks
🔓 [ShareModal] Decrypting key chunks...
✅ [ShareModal] Key decryption complete
📤 [ShareModal] Calling shareFile...
🔄 [shareFile] Starting share process
✅ [shareFile] Expiration converted
✅ [shareFile] Symmetric key converted to chunks
🔐 [shareFile] Creating FHE encrypted input for recipient
✅ [shareFile] FHE encryption complete
✅ [getContract] Contract instance created
📝 [shareFile] Calling contract.shareFile with params
⏳ [shareFile] Transaction sent, waiting for confirmation
✅ [shareFile] Transaction confirmed
🎉 [shareFile] Share successful!
📊 [ShareModal] shareFile result: { success: true }
🎉 [ShareModal] Share complete, showing success screen
```

#### ❌ Failure Points:

1. **Early Validation Failure:**
   ```
   ❌ [shareFile] Invalid recipient address
   ❌ [shareFile] Cannot share with self
   ❌ [shareFile] Expiration in the past
   ```

2. **Encryption Failure:**
   ```
   ✅ [shareFile] Symmetric key converted to chunks
   🔐 [shareFile] Creating FHE encrypted input for recipient
   ❌ [shareFile] Error occurred
   ```

3. **Contract Call Failure:**
   ```
   📝 [shareFile] Calling contract.shareFile with params
   ❌ [shareFile] Error occurred
   🔍 [shareFile] Error analysis
   🔍 [shareFile] Detected: [ErrorName] error
   ```

4. **Transaction Failure:**
   ```
   ⏳ [shareFile] Transaction sent, waiting for confirmation
   ❌ [shareFile] Transaction failed
   ```

---

## 🔍 Reading Error Data

### AlreadyShared Error Example

```javascript
❌ [shareFile] Error occurred: {
  error: { ... },
  message: "missing revert data",
  code: "CALL_EXCEPTION",
  data: null,
  errorData: {
    data: "0x70a4b574..."  // ← This contains the error selector!
  }
}

🔍 [shareFile] Error analysis: {
  message: "missing revert data (action=\"estimateGas\", ...)",
  errorData: { data: "0x70a4b574..." },
  errorString: "{\"data\":\"0x70a4b574...\"}"
}

🔍 [shareFile] Detected: AlreadyShared error
```

### What Each Field Means

| Field | Description | Example |
|-------|-------------|---------|
| `message` | High-level error description | "missing revert data" |
| `code` | Error code from ethers.js | "CALL_EXCEPTION" |
| `data` | Direct error data (may be null) | null |
| `errorData` | Nested error data | `{ data: "0x70a4b574..." }` |
| `errorString` | Stringified error data for searching | `"{\"data\":\"0x70a4b574\"}"` |

---

## 🎯 Common Error Patterns

### 1. AlreadyShared (0x70a4b574)

**Log Output:**
```
🔍 [shareFile] Detected: AlreadyShared error
```

**Cause:** File is already shared with this recipient

**Solution:** Revoke existing share first, then re-share

---

### 2. SelfShare (0x0bef78fe)

**Log Output:**
```
🔍 [shareFile] Detected: SelfShare error
```

**Cause:** Trying to share with your own address

**Solution:** Enter a different recipient address

---

### 3. InvalidExpiration (0xfb2a6752)

**Log Output:**
```
🔍 [shareFile] Detected: InvalidExpiration error
```

**Cause:**
- Expiration timestamp is in the past
- Expiration exceeds 365 days
- Expiration is before current expiration (when extending)

**Solution:** Select a valid expiration date

---

### 4. NotFileOwner (0xabea3229)

**Log Output:**
```
🔍 [shareFile] Detected: NotFileOwner error
```

**Cause:** Current user is not the file owner

**Solution:** Only the file owner can share files

---

### 5. FileNotFound (0xed20d764)

**Log Output:**
```
🔍 [shareFile] Detected: FileNotFound error
```

**Cause:** File ID doesn't exist in the contract

**Solution:** Verify the file was successfully registered

---

### 6. ErrFileDeleted (0x1d08e3b3)

**Log Output:**
```
🔍 [shareFile] Detected: ErrFileDeleted error
```

**Cause:** File has been soft-deleted

**Solution:** Cannot share deleted files

---

## 📋 Debugging Checklist

When a share fails, check these logs in order:

- [ ] **ShareModal logs appear** - UI is working
- [ ] **User role is correct** - isOwner = true for file owner
- [ ] **Key chunks retrieved** - hasChunks = true, chunkCount = 4
- [ ] **Key decrypted successfully** - hasKey = true, keyLength = 32
- [ ] **shareFile called** - Parameters logged correctly
- [ ] **Expiration converted** - If using expiration, uint32 value shown
- [ ] **Chunks created** - 4 chunks from symmetric key
- [ ] **FHE encryption complete** - 4 handles + proof
- [ ] **Contract instance created** - Correct address and network
- [ ] **Contract call made** - Transaction parameters logged
- [ ] **Transaction sent** - Hash received
- [ ] **Transaction confirmed** - Receipt with status = 1

If failure occurs:
- [ ] **Check error selector** - Which error (0x70a4b574, etc.)
- [ ] **Read error message** - Specific cause
- [ ] **Check Hardhat terminal** - Backend error details

---

## 🛠️ Advanced Debugging

### View Full Error Object

In browser console:
```javascript
// When you see an error log, expand it to see full details
❌ [shareFile] Error occurred: { ... }  // ← Click the arrow to expand
```

### Filter Logs

```javascript
// In console filter box:
[shareFile]      // Only shareFile logs
[ShareModal]     // Only ShareModal logs
❌               // Only errors
✅               // Only successes
```

### Copy Error for Investigation

Right-click on any log entry → "Store as global variable" → Copy

---

## 📝 Example Debug Session

```
🚀 [ShareModal] Starting share process {
  fileId: "0xabc...",
  recipient: "0x7099...79C8",
  expiresAt: 1739750400
}

👤 [ShareModal] User role { isOwner: true }
🔑 [ShareModal] Retrieved encrypted chunks { method: "direct (owner)", hasChunks: true, chunkCount: 4 }
🔓 [ShareModal] Decrypting key chunks...
✅ [ShareModal] Key decryption complete { hasKey: true, keyLength: 32 }
📤 [ShareModal] Calling shareFile...

🔄 [shareFile] Starting share process {
  fileId: "0xabc...",
  recipient: "0x7099...79C8",
  owner: "0x5555...5555",
  expiresAt: 1739750400
}

✅ [shareFile] Expiration converted {
  original: 1739750400,
  uint32: 1739750400,
  date: "2025-02-17T00:00:00.000Z"
}

✅ [shareFile] Symmetric key converted to chunks {
  chunkCount: 4,
  chunks: ["a1b2c3d4...", "e5f6a7b8...", "c9d0e1f2...", "a3b4c5d6..."]
}

🔐 [shareFile] Creating FHE encrypted input for recipient: 0x7099...79C8

✅ [shareFile] FHE encryption complete {
  handleCount: 4,
  handles: ["0x1234abcd...", "0x5678efgh...", ...],
  hasProof: true,
  proofLength: 1024
}

✅ [getContract] Contract instance created {
  contractAddress: "0x1234...abcd",
  signerAddress: "0x5555...5555",
  network: { chainId: 8009n, name: "Zama Devnet" }
}

📝 [shareFile] Calling contract.shareFile with params {
  fileId: "0xabc...",
  recipient: "0x7099...79C8",
  expiresAt: 1739750400,
  handleCount: 4
}

⏳ [shareFile] Transaction sent, waiting for confirmation {
  txHash: "0x9876...5432"
}

✅ [shareFile] Transaction confirmed {
  blockNumber: 123456,
  status: 1,
  gasUsed: "450000"
}

🎉 [shareFile] Share successful!
📊 [ShareModal] shareFile result { success: true }
🎉 [ShareModal] Share complete, showing success screen
```

---

## ✅ What to Report

If you encounter an issue, provide:

1. **Full console logs** - Copy everything from 🚀 to ❌
2. **Hardhat terminal output** - If running local node
3. **Transaction hash** - If transaction was sent
4. **Error selector** - The 0x... code from error data
5. **Network** - Which network you're on
6. **Addresses:**
   - Contract address
   - Your address (owner)
   - Recipient address
   - File ID

---

**Generated:** 2026-02-16
**Status:** ✅ Active Logging Enabled

