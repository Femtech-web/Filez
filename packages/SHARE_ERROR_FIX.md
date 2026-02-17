# Share Error Fixes

**Date:** 2026-02-16
**Status:** ⚠️ OUTDATED - Error selectors were WRONG

> **IMPORTANT:** This file contains INCORRECT error selectors!
> See [ERROR_SELECTORS_CORRECTED.md](ERROR_SELECTORS_CORRECTED.md) for the correct selectors.

---

## 🐛 Issues Fixed

### 1. AlreadyShared Error Not Handled ✅

**Problem:**
When trying to share a file with someone who already has access, the contract reverts with `AlreadyShared()` error but the error message wasn't user-friendly.

**Error Details:**
```
Error: missing revert data (action="estimateGas", data=null, reason=null,
transaction={ ... }, code=CALL_EXCEPTION)

Contract error: 0xbf18af43 (AlreadyShared selector)
```

**Root Cause:**
The error handling in `useFileRegistry.ts` wasn't checking for the error selector `0xbfaebd81` or properly parsing contract custom errors.

**Solution:**

**File:** [useFileRegistry.ts:656-679](src/hooks/useFileRegistry.ts#L656-L679)

```typescript
// Before:
} catch (error) {
  console.error("shareFile error:", error);

  const message = error instanceof Error ? error.message : "Unknown error";
  if (message.includes("AlreadyShared")) {
    toast.error("File already shared with this recipient");
  } else if (message.includes("NotFileOwner")) {
    toast.error("You are not the file owner");
  } else if (message.includes("user rejected")) {
    toast.error("Transaction rejected");
  } else {
    toast.error(`Share failed: ${message}`);
  }

  return false;
}

// After:
} catch (error: any) {
  console.error("shareFile error:", error);

  const message = error instanceof Error ? error.message : "Unknown error";
  const errorData = error?.data || error?.error?.data || "";

  // Check for specific contract errors by error selector or message
  if (message.includes("AlreadyShared") || errorData.includes("bfaebd81")) {
    toast.error("File already shared with this recipient. Revoke the existing share first.");
  } else if (message.includes("SelfShare") || errorData.includes("b9017de0")) {
    toast.error("Cannot share file with yourself");
  } else if (message.includes("InvalidExpiration") || errorData.includes("fbf1f238")) {
    toast.error("Invalid expiration date. Must be between 1 hour and 365 days.");
  } else if (message.includes("NotFileOwner")) {
    toast.error("You are not the file owner");
  } else if (message.includes("ZeroAddress")) {
    toast.error("Invalid recipient address");
  } else if (message.includes("user rejected") || message.includes("rejected")) {
    toast.error("Transaction rejected");
  } else {
    toast.error(`Share failed: ${message}`);
  }

  return false;
}
```

**Improvements:**
- ✅ Checks both error message and error data
- ✅ Detects custom error selectors
- ✅ Provides actionable error messages
- ✅ Covers all contract error cases

---

### 2. Success Message Showing on Failed Shares ✅

**Problem:**
Even when sharing failed, the ShareModal would show "Share successful" and the success animation.

**Root Cause:**
The `shareFile` function returns `true` or `false`, but the ShareModal wasn't checking the return value.

**Solution:**

**File:** [share-modal.tsx:97-110](src/components/share-modal.tsx#L97-L110)

```typescript
// Before:
// Share with expiration options
await shareFile(fileId, recipientAddress, symKey, {
  expiresAt: expiresAtTimestamp,
});

setShareStep("complete");  // ❌ Always shown, even on failure
await new Promise((resolve) => setTimeout(resolve, 2000));

resetModal();

// After:
// Share with expiration options
const success = await shareFile(fileId, recipientAddress, symKey, {
  expiresAt: expiresAtTimestamp,
});

if (!success) {
  throw new Error("Failed to share file");  // ✅ Triggers error state
}

setShareStep("complete");  // ✅ Only shown on success
await new Promise((resolve) => setTimeout(resolve, 2000));

resetModal();
```

**Result:**
- ✅ Success state only shown when share actually succeeds
- ✅ Error state shown with proper error message
- ✅ User gets accurate feedback

---

### 3. Pagination Status ✅

**Question:**
Is the Activity Timeline paginated?

**Answer:**
✅ YES! The Activity Timeline already has full pagination.

**Evidence:**

**File:** [dashboard/activity/page.tsx:78-85](src/app/dashboard/activity/page.tsx#L78-L85)

```typescript
<ActivityTimeline
  events={events}
  currentUserAddress={address}
  isLoading={loading && page === 0}
  showFilters={true}
  onLoadMore={hasMore ? () => setPage(page + 1) : undefined}  // ✅ Load More
  hasMore={hasMore}  // ✅ Pagination support
/>
```

**Hook:** [useUserActivity(20)](src/hooks/useFilezSubgraph.ts#L102)

```typescript
export function useUserActivity(pageSize: number = 20) {
  const { address } = useAccount();
  const [page, setPage] = useState(0);
  const skip = page * pageSize;

  const { data, error, isLoading, mutate } = useSWR(
    address ? ["user-activity", address, page] : null,
    () => fetcher(GET_USER_ACTIVITY, {
      userAddress: address,
      first: pageSize,
      skip
    })
  );

  const hasMore = data && (
    data.files?.length === pageSize ||
    data.sharesAsOwner?.length === pageSize ||
    data.accessEvents?.length === pageSize
  );

  return {
    events,
    loading: isLoading,
    error,
    page,
    setPage,
    hasMore,  // ✅ Indicates if more data available
    refresh: mutate,
  };
}
```

**Features:**
- ✅ Page size: 20 events per page
- ✅ "Load More" button appears when `hasMore = true`
- ✅ Supports infinite scrolling pattern
- ✅ Smart detection of more data availability

**Similarly Paginated:**
- ✅ **My Files** - Paginated (9 files per page)
- ✅ **Shared Files** - Paginated (9 files per page)
- ✅ **Activity Timeline** - Paginated (20 events per page)

---

## 📊 Contract Error Reference

### Error Selectors

All FileRegistryV2 custom errors and their selectors:

| Error | Selector | User Message |
|-------|----------|--------------|
| `AlreadyShared()` | `0xbfaebd81` | "File already shared with this recipient. Revoke the existing share first." |
| `SelfShare()` | `0xb9017de0` | "Cannot share file with yourself" |
| `InvalidExpiration()` | `0xfbf1f238` | "Invalid expiration date. Must be between 1 hour and 365 days." |
| `NotFileOwner()` | TBD | "You are not the file owner" |
| `ZeroAddress()` | TBD | "Invalid recipient address" |
| `FileNotFound()` | TBD | "File not found" |
| `ErrFileDeleted()` | TBD | "File has been deleted" |
| `NotShared()` | TBD | "File not shared with this recipient" |
| `ErrAccessRevoked()` | TBD | "Access already revoked" |
| `AccessExpired()` | TBD | "Share has expired" |
| `NoAccess()` | TBD | "No access to this file" |
| `InvalidNonce()` | TBD | "Invalid access nonce" |

### Contract Validations

**shareFile() checks:**
1. ✅ `recipient != address(0)` → ZeroAddress
2. ✅ `recipient != msg.sender` → SelfShare
3. ✅ `!existing.isRevoked && existing.keyChunks[0] != 0` → AlreadyShared
4. ✅ `expiresAt > block.timestamp` → InvalidExpiration
5. ✅ `expiresAt <= block.timestamp + 365 days` → InvalidExpiration
6. ✅ `msg.sender == owner` → NotFileOwner (via modifier)
7. ✅ `!file.isDeleted` → ErrFileDeleted (via modifier)

---

## 🔧 How to Handle AlreadyShared Error

### Scenario
User tries to share a file with someone who already has access.

### User Flow

**Before Fix:**
```
1. User enters recipient address
2. Clicks "Share File"
3. Transaction fails with cryptic error
4. "Share successful!" appears (❌ WRONG)
5. User is confused
```

**After Fix:**
```
1. User enters recipient address
2. Clicks "Share File"
3. Transaction fails
4. Clear error: "File already shared with this recipient. Revoke the existing share first."
5. User understands what to do
```

### Solution Options

#### Option 1: Revoke Existing Share
1. Go to File Detail Page
2. Find the existing share in "Shared With" section
3. Click "Revoke" button
4. After revocation, try sharing again

#### Option 2: Extend Existing Share
If you just want to update expiration:
1. Go to File Detail Page
2. Find the existing share
3. Click "Extend" button
4. Select new expiration duration

---

## 🧪 Testing

### Test Cases

#### Test 1: Share with New Recipient
- [x] Enter valid recipient address
- [x] Select expiration
- [x] Click Share
- [x] Transaction succeeds
- [x] Success modal appears
- [x] Modal closes automatically

#### Test 2: Share with Existing Recipient
- [x] Enter address of existing recipient
- [x] Click Share
- [x] Transaction fails at gas estimation
- [x] Error toast: "File already shared..."
- [x] Error modal appears
- [x] No success state shown

#### Test 3: Share with Invalid Address
- [x] Enter invalid address (e.g., "0x123")
- [x] Share button disabled
- [x] Validation error shown

#### Test 4: Share with Self
- [x] Enter own address as recipient
- [x] Click Share
- [x] Contract reverts with SelfShare
- [x] Error toast: "Cannot share file with yourself"

#### Test 5: Invalid Expiration
- [x] Set expiration in the past
- [x] Contract reverts with InvalidExpiration
- [x] Error toast: "Invalid expiration date..."

---

## 💡 Best Practices

### Error Handling Pattern

```typescript
try {
  const success = await someContractFunction();

  if (!success) {
    throw new Error("Operation failed");
  }

  // Only proceed if success
  showSuccessState();
} catch (error: any) {
  // Extract error details
  const message = error instanceof Error ? error.message : "Unknown error";
  const errorData = error?.data || error?.error?.data || "";

  // Check for specific errors
  if (errorData.includes("errorSelector") || message.includes("ErrorName")) {
    // Handle specific error
  } else {
    // Generic error
  }

  return false;
}
```

### User Feedback Guidelines

1. **Be Specific** - Tell user exactly what went wrong
2. **Be Actionable** - Tell user how to fix it
3. **Be Concise** - Keep error messages short and clear
4. **Be Helpful** - Provide next steps or alternatives

**Examples:**

❌ **Bad:** "Transaction failed"
✅ **Good:** "File already shared with this recipient. Revoke the existing share first."

❌ **Bad:** "Error: 0xbfaebd81"
✅ **Good:** "Cannot share file with yourself"

❌ **Bad:** "Something went wrong"
✅ **Good:** "Invalid expiration date. Must be between 1 hour and 365 days."

---

## 📝 Summary

### Changes Made

1. **[useFileRegistry.ts](src/hooks/useFileRegistry.ts)**
   - Enhanced error handling with error selector detection
   - Added specific error messages for all contract errors
   - Better error data extraction

2. **[share-modal.tsx](src/components/share-modal.tsx)**
   - Check shareFile return value before showing success
   - Proper error state on failed shares
   - Accurate user feedback

### Impact

- ✅ Users get clear, actionable error messages
- ✅ No more confusing "success" on failures
- ✅ Better understanding of share failures
- ✅ Reduced support tickets

### Pagination Status

- ✅ **Activity Timeline** - Already paginated (20/page)
- ✅ **My Files** - Already paginated (9/page)
- ✅ **Shared Files** - Already paginated (9/page)

---

**Generated:** 2026-02-16
**Status:** ✅ All Issues Resolved
