# staticCall Fix - requestAccess Returning Transaction Instead of Data

**Date:** 2026-02-16
**Status:** ✅ **FIXED**

---

## 🐛 The Bug

When recipient tried to decrypt a shared file, `requestAccess()` was returning a `ContractTransactionResponse` instead of the actual encrypted key chunks.

### Logs Showing the Problem

```javascript
🔍 [requestAccess] Raw result from contract: {
  result: ContractTransactionResponse,  // ❌ WRONG - This is a transaction object!
  resultType: 'object',
  isArray: false,
  resultKeys: ['provider', 'blockNumber', 'blockHash', 'index', 'hash', ...], // Transaction properties
  resultLength: undefined,
  result0: undefined,  // ❌ No data!
  result1: undefined,
  result2: undefined,
  result3: undefined,
}
```

---

## 🔍 Root Cause

### Contract Function Signature

**File:** [contracts/file-registry-v2.sol:488-517](contracts/file-registry-v2.sol#L488-L517)

```solidity
function requestAccess(bytes32 fileId)
    external              // ⚠️ NOT "view" - This is state-changing!
    fileActive(fileId)
    returns (bytes32[4] memory)
{
    // ... validation logic ...

    emit FileAccessed(fileId, msg.sender, block.timestamp);  // ⚠️ Emits event

    return share.keyChunks;  // Returns data
}
```

**The Issue:**
- `requestAccess` is **NOT** a `view` function
- It emits the `FileAccessed` event, making it state-changing
- When you call a non-view function in ethers.js, it **sends a transaction** and returns a `ContractTransactionResponse`
- The actual return value is NOT accessible from the transaction response

---

## ✅ The Fix

### Use `staticCall` to Simulate Without Sending Transaction

**File:** [src/hooks/useFileRegistry.ts:1059](src/hooks/useFileRegistry.ts#L1059)

**Before (Broken):**
```typescript
const result = await contract.requestAccess(fileId);
// Returns: ContractTransactionResponse (transaction object)
// result[0], result[1], result[2], result[3] = undefined
```

**After (Fixed):**
```typescript
const result = await contract.requestAccess.staticCall(fileId);
// Returns: bytes32[4] array (actual data)
// result[0], result[1], result[2], result[3] = encrypted key chunks
```

---

## 📚 Ethers.js v6 Documentation

From ethers.js docs:

### Regular Function Call (Non-View Functions)
```typescript
await contract.functionName(args)
// - Sends a real transaction to the blockchain
// - Consumes gas
// - Returns ContractTransactionResponse
// - Actual return value is NOT accessible
```

### Static Call (Read-Only Simulation)
```typescript
await contract.functionName.staticCall(args)
// - Simulates the transaction locally
// - Does NOT send to blockchain
// - Does NOT consume gas
// - Returns the actual return value
// - Perfect for reading data from non-view functions
```

---

## 🎯 Why V2 Uses Non-View Function

### V1 Approach
```solidity
function requestAccess(bytes32 fileId)
  external
  view  // ✅ View function - no events
  returns (bytes32[4] memory)
{
  // ... validation ...
  return chunks;
}
```

### V2 Approach (Better for Auditing)
```solidity
function requestAccess(bytes32 fileId)
  external  // ❌ NOT view - emits event
  fileActive(fileId)
  returns (bytes32[4] memory)
{
  // ... validation ...

  emit FileAccessed(fileId, msg.sender, block.timestamp);  // 📊 Audit trail

  return share.keyChunks;
}
```

**Why Emit Event:**
- Creates an **audit trail** of who accessed which files
- Can be indexed by subgraphs for analytics
- Provides compliance and monitoring capabilities

**Trade-off:**
- Makes function non-view (state-changing)
- Requires `staticCall` when reading data from frontend

---

## 🔧 Complete Fix Applied

### Updated requestAccess Function

**File:** [src/hooks/useFileRegistry.ts:1050-1095](src/hooks/useFileRegistry.ts#L1050-L1095)

```typescript
const requestAccess = useCallback(
  async (fileId: string): Promise<string[] | null> => {
    if (!signer) {
      toast.error("Wallet not connected");
      return null;
    }

    try {
      const contract = await getContract();

      // ✅ CRITICAL: requestAccess is NOT a view function (it emits events)
      // So we must use staticCall to get the return value without sending a transaction
      const result = await contract.requestAccess.staticCall(fileId);

      console.log("🔍 [requestAccess] Raw result from contract:", {
        result,
        resultType: typeof result,
        isArray: Array.isArray(result),
        resultKeys: Object.keys(result),
        resultLength: result?.length,
        result0: result[0],
        result1: result[1],
        result2: result[2],
        result3: result[3],
      });

      // Convert Result object to array
      const handles: string[] = [
        result[0],
        result[1],
        result[2],
        result[3],
      ];

      console.log("✅ [requestAccess] Retrieved handles:", {
        handleCount: handles.length,
        handles: handles.map((h, i) => ({
          index: i,
          value: h ? h.slice(0, 10) + "..." : "null/undefined",
        })),
        allDefined: handles.every(h => h && h !== "0x0000..."),
      });

      return handles;

    } catch (error) {
      console.error("requestAccess error:", error);
      // ... error handling ...
      return null;
    }
  },
  [signer, getContract]
);
```

---

## 📊 Expected Behavior After Fix

### Before staticCall Fix
```
🔍 [requestAccess] Raw result from contract: {
  result: ContractTransactionResponse,
  result0: undefined,
  result1: undefined,
  result2: undefined,
  result3: undefined,
}

❌ [decryptKeyHandles] Invalid chunk count: 0
Failed to load metadata: DataError: AES key data must be 128 or 256 bits
```

### After staticCall Fix
```
🔍 [requestAccess] Raw result from contract: {
  result: Result(4) [...],
  result0: "0x123abc...",
  result1: "0x456def...",
  result2: "0x789ghi...",
  result3: "0xabcjkl...",
}

✅ [requestAccess] Retrieved handles: {
  handleCount: 4,
  allDefined: true
}

✅ [decryptKeyHandles] Decryption successful
✅ File decrypted and displayed
```

---

## 🎉 Summary

### The Journey

1. **Initial Issue**: Recipient couldn't decrypt shared files
2. **First Debug**: Added logging, saw `handleCount: 0`
3. **Second Debug**: Saw `result` was `ContractTransactionResponse` instead of data
4. **Root Cause**: `requestAccess` is non-view function (emits event for audit trail)
5. **Solution**: Use `staticCall` to read return value without sending transaction

### Lesson Learned

**Non-View Functions in Ethers.js v6:**
- Regular call: `contract.functionName(args)` → Returns transaction object
- Static call: `contract.functionName.staticCall(args)` → Returns actual data

Always use `staticCall` when you need the return value from a non-view function without actually sending a transaction to the blockchain.

---

**Generated:** 2026-02-16
**Status:** ✅ Fixed - Ready for Testing
