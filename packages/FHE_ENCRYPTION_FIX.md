# FHE Encryption Fix - Critical Bug Found!

**Date:** 2026-02-16
**Status:** ✅ **ROOT CAUSE IDENTIFIED AND FIXED**

---

## 🐛 The Bug

### What We Thought Was Wrong

Earlier, we "fixed" this code:

```typescript
// We thought this was WRONG:
const fheInput = fhevm.createEncryptedInput(fileRegistryAddress, address);

// And changed it to this (which we thought was CORRECT):
const fheInput = fhevm.createEncryptedInput(fileRegistryAddress, recipient);
```

**We were wrong!** The original code was correct, and our "fix" broke sharing!

---

## ✅ The Actual Fix

### Correct Implementation

```typescript
// ✅ CORRECT: Use sender's address (the one creating the proof)
const fheInput = fhevm.createEncryptedInput(fileRegistryAddress, address);

// NOT recipient!
```

---

## 🔍 Why This Is Correct

### FHE Encrypted Input Creation Flow

1. **Proof Creator**: The second parameter to `createEncryptedInput()` must be the **address creating the proof** (msg.sender)
2. **Proof Validation**: The contract validates the proof came from the transaction sender
3. **Permission Granting**: The contract then uses `FHE.allow()` to grant decryption rights to the recipient

### Complete Flow

```typescript
// Frontend (Owner sharing file):
const fheInput = fhevm.createEncryptedInput(
  contractAddress,
  ownerAddress    // ← Owner creates the proof (msg.sender)
);
fheInput.add64(chunk0);
fheInput.add64(chunk1);
fheInput.add64(chunk2);
fheInput.add64(chunk3);
const encrypted = await fheInput.encrypt();

// Contract (shareFile function):
function shareFile(..., bytes calldata inputProof) {
  // Validate proof is from msg.sender (owner)
  euint64 k0 = FHE.fromExternal(keyChunk0, inputProof);  // Validates sender

  // Grant recipient permission to decrypt
  FHE.allow(k0, recipient);  // ← Recipient gets access here
}
```

---

## 🚨 The Error We Were Getting

```
Error: VM Exception while processing transaction: reverted with an unrecognized custom error
(return data: 0xbf18af43...)
```

**What This Means:**
- Error code `0xbf18af43` is from the **Zama FHE library**, not our contract
- It means: **"Invalid proof - proof creator doesn't match msg.sender"**
- Our console logs confirmed: Contract got to `FHE.fromExternal()` and crashed there

---

## 📊 Contract Logs Proved It

From Hardhat terminal:

```
=== shareFile START ===
Check 1: ZeroAddress        ✅ PASSED
Check 2: SelfShare          ✅ PASSED
Check 3: AlreadyShared      ✅ PASSED
Check 4: Expiration valid   ✅ PASSED
Step 5: Converting FHE external to internal types
[CRASH - didn't even print "k0 converted"]

Error: 0xbf18af43...
```

This proved the issue was in `FHE.fromExternal()`, not our validation logic!

---

## 💡 Key Insight

### Misunderstanding

We confused "encrypt FOR someone" with "encrypt BY someone"

- ❌ **Wrong thinking**: "We're sharing with recipient, so create encrypted input with recipient's address"
- ✅ **Correct thinking**: "We (the owner) are submitting the transaction, so create encrypted input with our address"

### The Role of Each Component

| Component | Role | Address Used |
|-----------|------|--------------|
| `createEncryptedInput()` | Create proof that **sender** is authorized | **Sender's address** |
| `FHE.fromExternal()` | Validate proof matches **msg.sender** | Validates against **sender** |
| `FHE.allow()` | Grant **recipient** decryption rights | **Recipient's address** |

---

## 🔧 The Fix Applied

**File:** [src/hooks/useFileRegistry.ts](src/hooks/useFileRegistry.ts)

### Before (Broken):
```typescript
const fheInput = fhevm.createEncryptedInput(fileRegistryAddress, recipient);
```

### After (Fixed):
```typescript
const fheInput = fhevm.createEncryptedInput(fileRegistryAddress, address);
```

Where:
- `address` = current user (owner sharing the file)
- `recipient` = person receiving access

---

## 📚 Zama FHE Documentation Reference

From Zama docs:

> `createEncryptedInput(contractAddress, userAddress)`
> - `contractAddress`: The target contract
> - `userAddress`: **The address of the user creating the proof** (must match msg.sender)

The proof authenticates the **sender**, not the recipient!

---

## 🎯 Why V1 Worked

Looking at V1 code, it would have also used the sender's address, which is why sharing worked in V1 but broke in V2 after our "fix".

---

## ✅ Testing After Fix

### Expected Behavior

1. Owner creates encrypted input with **their own address**
2. Proof validates that owner is msg.sender
3. Contract stores encrypted chunks
4. Contract calls `FHE.allow(k0, recipient)` to grant recipient access
5. Recipient can decrypt using their own address

### Test Case

```typescript
// Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// Recipient: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

// Frontend:
const fheInput = fhevm.createEncryptedInput(
  contractAddress,
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"  // Owner's address
);

// Contract:
FHE.fromExternal(keyChunk0, inputProof);  // Validates owner
FHE.allow(k0, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8");  // Grants recipient
```

---

## 🎉 Summary

### The Journey

1. **Original code**: Used `address` (sender) ✅ Correct!
2. **We "fixed" it**: Changed to `recipient` ❌ This broke it!
3. **Error appeared**: `0xbf18af43` from FHE library
4. **We debugged**: Added logs to contract
5. **Found root cause**: `FHE.fromExternal()` validates proof is from sender
6. **Real fix**: Changed back to `address` (sender) ✅ Correct!

### Lesson Learned

**FHE Encrypted Input Proof** authenticates the **transaction sender**, not the **data recipient**.

Permission to decrypt is granted separately via `FHE.allow()`.

---

**Generated:** 2026-02-16
**Status:** ✅ Bug Fixed - Ready for Testing

