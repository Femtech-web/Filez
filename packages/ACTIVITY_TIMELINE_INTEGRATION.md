# Activity Timeline V2 Integration Guide

**Date:** 2026-02-15
**Status:** ✅ **COMPLETE**
**Version:** FileZ V2 with Activity Timeline

---

## 📋 Overview

This document outlines the complete integration of the Activity Timeline feature into the FileZ V2 platform. The Activity Timeline provides a comprehensive audit trail of all file operations including uploads, shares, access events, revocations, deletions, and metadata updates.

---

## ✅ Completed Integration Steps

### 1. **Component Placement**

The ActivityTimeline component has been placed at:
```
/Users/mac/work/web3/zama/Filez/packages/src/components/activity-timeline.tsx
```

**Component Variants:**
- `ActivityTimeline` - Full-featured timeline with filters, date grouping, and pagination
- `ActivityTimelineCompact` - Compact version for sidebars (used in file detail pages)

---

### 2. **GraphQL Queries Updated** ✅

**File:** `/Users/mac/work/web3/zama/Filez/packages/src/lib/queries.ts`

**Changes Made:**

#### Updated Existing Queries:
```graphql
# GET_MY_FILES - Now filters deleted files and includes V2 fields
- Added: where: { owner: $owner, isDeleted: false }
- Added fields: isDeleted, deletedAt, activeShareCount, totalShareCount

# GET_SHARED_WITH_ME - Filters revoked/expired shares
- Changed: orderBy from "timestamp" to "sharedAt"
- Added: where filters for isRevoked: false, isExpired: false
- Added fields: sharedAt, expiresAt, isRevoked, revokedAt, isExpired, accessCount, lastAccessedAt

# GET_FILE - Includes V2 metadata
- Added fields: isDeleted, deletedAt, activeShareCount, totalShareCount

# GET_FILE_ACTIVITY - Complete activity for a specific file
- Changed: orderBy from "timestamp" to "sharedAt" for shares
- Added: accessEvents query (new V2)
- Added: revocationEvents query (new V2)
```

#### New Queries Added:
```graphql
# GET_USER_ACTIVITY - All activity for a user
- Queries: files, sharesAsOwner, sharesAsRecipient, accessEvents, revocationsAsOwner, revocationsAsRecipient

# GET_GLOBAL_STATS - Platform-wide statistics
- Returns: GlobalStats singleton entity
```

---

### 3. **Subgraph Hooks Enhanced** ✅

**File:** `/Users/mac/work/web3/zama/Filez/packages/src/hooks/useFilezSubgraph.ts`

**New Hooks Added:**

```typescript
// Hook for user's complete activity timeline
export function useUserActivity(pageSize: number = 20): {
  events: ActivityEvent[];
  loading: boolean;
  error: any;
  page: number;
  setPage: (page: number) => void;
  hasMore: boolean;
  refresh: () => void;
}

// Hook for global platform stats
export function useGlobalStats(): {
  stats: GlobalStats | null;
  loading: boolean;
  error: any;
}
```

**Updated Imports:**
- Added: `GET_USER_ACTIVITY`, `GET_GLOBAL_STATS`
- Added: `transformActivityEvents` from transformers
- Added: `ActivityEvent` type from activity-timeline component

---

### 4. **Transformers Created** ✅

**File:** `/Users/mac/work/web3/zama/Filez/packages/src/lib/transformers.ts`

**New Functions:**

```typescript
// Transform user activity data into ActivityEvent[] for dashboard
export function transformActivityEvents(data: any, currentUserAddress: string): ActivityEvent[]

// Transform file-specific activity for file detail pages
export function transformFileActivityEvents(data: any): ActivityEvent[]
```

**Event Types Supported:**
- `file_registered` - File uploads
- `file_shared` - Share events with expiration metadata
- `access_revoked` - Revocation events
- `file_accessed` - Access events (owner vs recipient)
- `file_deleted` - Deletion events
- `metadata_updated` - Metadata updates (future)
- `share_extended` - Expiration extensions (future)

---

### 5. **File Detail Page Integration** ✅

**File:** `/Users/mac/work/web3/zama/Filez/packages/src/app/file/[id]/page.tsx`

**Changes Made:**

```typescript
// Added imports
import { ActivityTimelineCompact } from "@/components/activity-timeline";
import { transformFileActivityEvents } from "@/lib/transformers";

// Transform activity data
const activityEvents = transformFileActivityEvents(activity);

// Replaced old activity section (lines 246-285) with:
<ActivityTimelineCompact
  events={activityEvents}
  currentUserAddress={address}
  maxItems={10}
/>
```

**Benefits:**
- Rich activity visualization with icons and colors
- Transaction hash links to block explorer
- Expiration time display for shares
- Owner vs recipient access differentiation

---

### 6. **Dashboard Activity Tab Created** ✅

**New File:** `/Users/mac/work/web3/zama/Filez/packages/src/app/dashboard/activity/page.tsx`

**Features:**
- Full `ActivityTimeline` component with filters
- Global platform statistics sidebar
- Real-time activity updates from subgraph
- Pagination support
- Filter by event type and date range

**Dashboard Tab Added:**
Updated `/Users/mac/work/web3/zama/Filez/packages/src/app/dashboard/DashboardPage.tsx` to include Activity tab navigation.

---

## 🎯 Usage Examples

### 1. **File Detail Page - Compact Timeline**

```tsx
import { ActivityTimelineCompact } from "@/components/activity-timeline";
import { transformFileActivityEvents } from "@/lib/transformers";

const activityEvents = transformFileActivityEvents(activity);

<ActivityTimelineCompact
  events={activityEvents}
  currentUserAddress={address}
  maxItems={10}
  onViewAll={() => router.push("/dashboard/activity")}
/>
```

### 2. **Dashboard Activity Page - Full Timeline**

```tsx
import { ActivityTimeline } from "@/components/activity-timeline";
import { useUserActivity } from "@/hooks/useFilezSubgraph";

const { events, loading, page, setPage, hasMore } = useUserActivity(20);

<ActivityTimeline
  events={events}
  currentUserAddress={address}
  isLoading={loading}
  showFilters={true}
  onLoadMore={() => setPage(page + 1)}
  hasMore={hasMore}
/>
```

### 3. **Global Stats Display**

```tsx
import { useGlobalStats } from "@/hooks/useFilezSubgraph";

const { stats, loading } = useGlobalStats();

{stats && (
  <div>
    <p>Total Files: {stats.totalFiles?.toString()}</p>
    <p>Active Shares: {stats.activeShares?.toString()}</p>
    <p>Total Users: {stats.totalUsers?.toString()}</p>
  </div>
)}
```

---

## 📊 Activity Event Types

| Event Type | Icon | Color | Description |
|------------|------|-------|-------------|
| `file_registered` | Upload | Green | File uploaded to platform |
| `file_shared` | Share2 | Blue | File shared with recipient |
| `access_revoked` | ShieldOff | Red | Access revoked by owner |
| `file_accessed` | Eye | Purple | File accessed (owner or recipient) |
| `file_deleted` | Trash2 | Orange | File soft-deleted |
| `metadata_updated` | FileEdit | Yellow | Metadata updated |
| `share_extended` | CalendarPlus | Cyan | Share expiration extended |

---

## 🔗 Integration Points

### Subgraph Integration

**Required Entities (from schema.graphql):**
- `File` - With V2 fields (isDeleted, deletedAt, activeShareCount, totalShareCount)
- `Share` - With V2 fields (sharedAt, expiresAt, isRevoked, isExpired, etc.)
- `AccessEvent` - NEW in V2
- `RevocationEvent` - NEW in V2
- `User` - For user stats
- `GlobalStats` - Platform-wide statistics

**Required Event Handlers (from src/file-registry.ts):**
- ✅ `handleFileRegistered()`
- ✅ `handleFileShared()`
- ✅ `handleAccessRevoked()`
- ✅ `handleFileAccessed()`
- ✅ `handleFileDeleted()`
- ✅ `handleMetadataUpdated()`
- ✅ `handleShareExtended()`

---

## 🚀 Testing the Integration

### 1. **Run Subgraph Locally**

```bash
cd /Users/mac/work/web3/zama/Filez/indexer

# Generate types
graph codegen

# Build subgraph
graph build

# Start local Graph Node (Docker)
docker compose up -d

# Deploy to local node
graph create --node http://localhost:8020/ filez-v2
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 filez-v2
```

### 2. **Test Activity Timeline**

#### Navigate to File Detail Page:
1. Go to `/file/[fileId]`
2. Check that ActivityTimelineCompact shows:
   - File registration event
   - Share events (if any)
   - Access events (if any)

#### Navigate to Dashboard Activity Page:
1. Go to `/dashboard/activity`
2. Verify:
   - All user events displayed
   - Filters work (event type, date range)
   - Pagination loads more events
   - Global stats sidebar shows correct numbers

### 3. **Test Event Scenarios**

```bash
# From frontend (or Hardhat console):

# 1. Register a file
await fileRegistry.registerFile(...)
# Should create: file_registered event

# 2. Share the file
await fileRegistry.shareFile(fileId, recipient, expiresAt, ...)
# Should create: file_shared event (with expiration)

# 3. Access the file
await fileRegistry.requestAccess(fileId)
# Should create: file_accessed event

# 4. Revoke access
await fileRegistry.revokeAccess(fileId, recipient)
# Should create: access_revoked event

# 5. Check activity timeline
# All events should appear in chronological order
```

---

## 🎨 UI/UX Features

### ActivityTimeline (Full)
- **Filters:**
  - Event type multi-select
  - Date range (All Time, Today, Week, Month)
  - Active filter count badge
- **Grouping:** Events grouped by date with headers
- **Pagination:** Load more button when hasMore=true
- **Rich Event Cards:**
  - Icon with colored background
  - Descriptive text with actor/recipient
  - Relative timestamps ("2 hours ago")
  - Transaction hash links (Sepolia Etherscan)
  - Expiration badges for shares

### ActivityTimelineCompact
- **Simplified UI** for sidebars
- **Recent events only** (maxItems prop)
- **Optional "View All" button**
- **Responsive design**

---

## 📝 Data Flow

```
Smart Contract (FileRegistryV2Optimized)
          ↓
    Emit Events
          ↓
The Graph Node (Indexer)
          ↓
Event Handlers (src/file-registry.ts)
          ↓
Create/Update Entities (File, Share, AccessEvent, etc.)
          ↓
GraphQL Queries (queries.ts)
          ↓
Subgraph Hooks (useFilezSubgraph.ts)
          ↓
Transformers (transformers.ts)
          ↓
ActivityTimeline Component
          ↓
User sees activity!
```

---

## ⚠️ Important Notes

### 1. **Timestamp Handling**

**Contract uses uint32 (seconds), Subgraph uses BigInt:**
```typescript
// In transformers - convert to JavaScript number (milliseconds)
timestamp: Number(event.timestamp) // Still in seconds

// In component - convert to milliseconds for Date
new Date(event.timestamp * 1000)
```

### 2. **File Names**

Since metadata is encrypted, activity timeline uses truncated file IDs:
```typescript
fileName: `File ${file.id.slice(0, 8)}...`
```

**Future Enhancement:** Could fetch and decrypt metadata to show real file names (requires additional UX consideration for loading states).

### 3. **Transaction Hashes**

Not all events have transaction hashes in the current implementation. This is expected - only on-chain events have transaction hashes available in subgraph event handlers.

### 4. **Filtering Deleted Files**

The `GET_MY_FILES` query now filters out deleted files:
```graphql
where: { owner: $owner, isDeleted: false }
```

If you want to show deleted files, create a separate query without this filter.

---

## 🔄 Next Steps (Future Enhancements)

### 1. **Real File Names**
- Fetch and decrypt metadata for activity events
- Cache decrypted names for performance
- Show loading states while decrypting

### 2. **Advanced Filters**
- Filter by specific file
- Filter by specific recipient/actor
- Search within activity

### 3. **Export Functionality**
- Export activity to CSV
- Generate PDF reports
- Compliance audit trails

### 4. **Notifications**
- Real-time notifications for new events
- Email summaries
- Push notifications for important events (revocations, expirations)

### 5. **Analytics Dashboard**
- Activity charts (timeline graphs)
- Share distribution pie charts
- User engagement metrics

---

## ✅ Integration Checklist

Before deploying to production, verify:

- [x] Subgraph schema updated with V2 entities
- [x] Subgraph.yaml configured with V2 events
- [x] Event handlers implemented for all 7 events
- [x] GraphQL queries updated with V2 fields
- [x] Transformers handle all event types
- [x] ActivityTimeline component integrated
- [x] File detail page shows activity
- [x] Dashboard activity tab created
- [x] Navigation updated with Activity tab
- [ ] Subgraph deployed and synced
- [ ] Frontend tested with real data
- [ ] Performance tested with large datasets
- [ ] Error handling verified
- [ ] Loading states tested
- [ ] Mobile responsiveness checked

---

## 📞 Support & Documentation

**Files Modified:**
1. `/Users/mac/work/web3/zama/Filez/packages/src/lib/queries.ts`
2. `/Users/mac/work/web3/zama/Filez/packages/src/hooks/useFilezSubgraph.ts`
3. `/Users/mac/work/web3/zama/Filez/packages/src/lib/transformers.ts`
4. `/Users/mac/work/web3/zama/Filez/packages/src/app/file/[id]/page.tsx`
5. `/Users/mac/work/web3/zama/Filez/packages/src/app/dashboard/DashboardPage.tsx`

**Files Created:**
1. `/Users/mac/work/web3/zama/Filez/packages/src/components/activity-timeline.tsx`
2. `/Users/mac/work/web3/zama/Filez/packages/src/app/dashboard/activity/page.tsx`

**Related Documentation:**
- [Subgraph Schema](/Users/mac/work/web3/zama/Filez/indexer/schema.graphql)
- [Subgraph Config](/Users/mac/work/web3/zama/Filez/indexer/subgraph.yaml)
- [Event Handlers](/Users/mac/work/web3/zama/Filez/indexer/src/file-registry.ts)
- [Verification Report](/Users/mac/work/web3/zama/Filez/indexer/VERIFICATION_REPORT.md)

---

**Integration Complete!** 🎉

The Activity Timeline is now fully integrated into FileZ V2. Users can track all file operations across the platform with a beautiful, filterable, and responsive timeline interface.
