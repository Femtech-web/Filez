"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import {
  Upload,
  Share2,
  ShieldOff,
  Eye,
  Trash2,
  Clock,
  FileEdit,
  CalendarPlus,
  Filter,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

/*//////////////////////////////////////////////////////////////
                        TYPES
//////////////////////////////////////////////////////////////*/

export type ActivityType = 
  | "file_registered"
  | "file_shared"
  | "access_revoked"
  | "file_accessed"
  | "file_deleted"
  | "metadata_updated"
  | "share_extended";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  fileId: string;
  fileName?: string;
  actor: string;
  recipient?: string;
  timestamp: number;
  transactionHash?: string;
  metadata?: {
    expiresAt?: number;
    oldExpiresAt?: number;
    newExpiresAt?: number;
    isOwnerAccess?: boolean;
  };
}

interface ActivityTimelineProps {
  events: ActivityEvent[];
  currentUserAddress?: string;
  isLoading?: boolean;
  showFilters?: boolean;
  maxItems?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

interface ActivityFilterState {
  types: ActivityType[];
  dateRange: "all" | "today" | "week" | "month";
}

/*//////////////////////////////////////////////////////////////
                        CONSTANTS
//////////////////////////////////////////////////////////////*/

const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: typeof Upload;
  label: string;
  color: string;
  bgColor: string;
}> = {
  file_registered: {
    icon: Upload,
    label: "File Uploaded",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  file_shared: {
    icon: Share2,
    label: "File Shared",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  access_revoked: {
    icon: ShieldOff,
    label: "Access Revoked",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  file_accessed: {
    icon: Eye,
    label: "File Accessed",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  file_deleted: {
    icon: Trash2,
    label: "File Deleted",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  metadata_updated: {
    icon: FileEdit,
    label: "Metadata Updated",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  share_extended: {
    icon: CalendarPlus,
    label: "Access Extended",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
};

/*//////////////////////////////////////////////////////////////
                        HELPERS
//////////////////////////////////////////////////////////////*/

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getActivityDescription(
  event: ActivityEvent, 
  currentUserAddress?: string
): string {
  const isCurrentUser = currentUserAddress?.toLowerCase() === event.actor.toLowerCase();
  const actorLabel = isCurrentUser ? "You" : shortenAddress(event.actor);
  
  switch (event.type) {
    case "file_registered":
      return `${actorLabel} uploaded ${event.fileName || "a file"}`;
      
    case "file_shared":
      if (event.recipient) {
        const recipientLabel = currentUserAddress?.toLowerCase() === event.recipient.toLowerCase()
          ? "you"
          : shortenAddress(event.recipient);
        return `${actorLabel} shared ${event.fileName || "a file"} with ${recipientLabel}`;
      }
      return `${actorLabel} shared ${event.fileName || "a file"}`;
      
    case "access_revoked":
      if (event.recipient) {
        const recipientLabel = currentUserAddress?.toLowerCase() === event.recipient.toLowerCase()
          ? "your"
          : `${shortenAddress(event.recipient)}'s`;
        return `${actorLabel} revoked ${recipientLabel} access to ${event.fileName || "a file"}`;
      }
      return `${actorLabel} revoked access to ${event.fileName || "a file"}`;
      
    case "file_accessed":
      const accessType = event.metadata?.isOwnerAccess ? "(owner)" : "";
      return `${actorLabel} ${accessType} accessed ${event.fileName || "a file"}`;
      
    case "file_deleted":
      return `${actorLabel} deleted ${event.fileName || "a file"}`;
      
    case "metadata_updated":
      return `${actorLabel} updated metadata for ${event.fileName || "a file"}`;
      
    case "share_extended":
      if (event.recipient && event.metadata?.newExpiresAt) {
        const recipientLabel = currentUserAddress?.toLowerCase() === event.recipient.toLowerCase()
          ? "your"
          : `${shortenAddress(event.recipient)}'s`;
        const newDate = format(new Date(event.metadata.newExpiresAt * 1000), "MMM d, yyyy");
        return `${actorLabel} extended ${recipientLabel} access until ${newDate}`;
      }
      return `${actorLabel} extended access to ${event.fileName || "a file"}`;
      
    default:
      return `Activity on ${event.fileName || "a file"}`;
  }
}

function filterEventsByDateRange(
  events: ActivityEvent[], 
  dateRange: ActivityFilterState["dateRange"]
): ActivityEvent[] {
  if (dateRange === "all") return events;
  
  const now = Date.now();
  const ranges = {
    today: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };
  
  const cutoff = now - ranges[dateRange];
  return events.filter(e => e.timestamp * 1000 >= cutoff);
}

/*//////////////////////////////////////////////////////////////
                        COMPONENTS
//////////////////////////////////////////////////////////////*/

function ActivityItem({ 
  event, 
  currentUserAddress,
  showTransaction = true
}: { 
  event: ActivityEvent;
  currentUserAddress?: string;
  showTransaction?: boolean;
}) {
  const config = ACTIVITY_CONFIG[event.type];
  const Icon = config.icon;
  const description = getActivityDescription(event, currentUserAddress);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-4 p-4 bg-card border border-border rounded-xl hover:border-border/80 transition-colors"
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{description}</p>
        
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(event.timestamp * 1000), { addSuffix: true })}
          </span>
          
          {showTransaction && event.transactionHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View TX
            </a>
          )}
        </div>
        
        {/* Expiration info for share events */}
        {event.type === "file_shared" && event.metadata?.expiresAt && event.metadata.expiresAt > 0 && (
          <div className="mt-2 px-2 py-1 bg-secondary/50 rounded-md inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Expires {format(new Date(event.metadata.expiresAt * 1000), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FilterDropdown({
  filters,
  onChange,
}: {
  filters: ActivityFilterState;
  onChange: (filters: ActivityFilterState) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const typeOptions: { value: ActivityType; label: string }[] = [
    { value: "file_registered", label: "Uploads" },
    { value: "file_shared", label: "Shares" },
    { value: "access_revoked", label: "Revocations" },
    { value: "file_accessed", label: "Access" },
    { value: "file_deleted", label: "Deletions" },
    { value: "share_extended", label: "Extensions" },
  ];
  
  const dateOptions: { value: ActivityFilterState["dateRange"]; label: string }[] = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];
  
  const toggleType = (type: ActivityType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onChange({ ...filters, types: newTypes });
  };
  
  const activeFiltersCount = 
    (filters.types.length < typeOptions.length ? 1 : 0) +
    (filters.dateRange !== "all" ? 1 : 0);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
      >
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">Filters</span>
        {activeFiltersCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden"
          >
            {/* Date Range */}
            <div className="p-4 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground mb-3">TIME RANGE</p>
              <div className="grid grid-cols-2 gap-2">
                {dateOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => onChange({ ...filters, dateRange: option.value })}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                      filters.dateRange === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Event Types */}
            <div className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">EVENT TYPES</p>
              <div className="space-y-2">
                {typeOptions.map(option => {
                  const config = ACTIVITY_CONFIG[option.value];
                  const isSelected = filters.types.includes(option.value);
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleType(option.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isSelected ? "bg-secondary" : "hover:bg-secondary/50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded ${config.bgColor} flex items-center justify-center`}>
                        <config.icon className={`w-3 h-3 ${config.color}`} />
                      </div>
                      <span className="text-sm flex-1 text-left">{option.label}</span>
                      <div className={`w-4 h-4 rounded border-2 transition-colors ${
                        isSelected 
                          ? "bg-primary border-primary" 
                          : "border-border"
                      }`}>
                        {isSelected && (
                          <svg className="w-full h-full text-primary-foreground" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Reset */}
            <div className="p-4 border-t border-border">
              <button
                onClick={() => onChange({ 
                  types: typeOptions.map(o => o.value),
                  dateRange: "all" 
                })}
                className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Activity</h3>
      <p className="text-sm text-muted-foreground">
        {hasFilters 
          ? "No events match your current filters"
          : "Your activity will appear here"
        }
      </p>
    </div>
  );
}

/*//////////////////////////////////////////////////////////////
                        MAIN COMPONENT
//////////////////////////////////////////////////////////////*/

export function ActivityTimeline({
  events,
  currentUserAddress,
  isLoading = false,
  showFilters = true,
  maxItems,
  onLoadMore,
  hasMore = false,
}: ActivityTimelineProps) {
  const [filters, setFilters] = useState<ActivityFilterState>({
    types: Object.keys(ACTIVITY_CONFIG) as ActivityType[],
    dateRange: "all",
  });
  
  // Apply filters
  const filteredEvents = useMemo(() => {
    let result = events;
    
    // Filter by type
    if (filters.types.length < Object.keys(ACTIVITY_CONFIG).length) {
      result = result.filter(e => filters.types.includes(e.type));
    }
    
    // Filter by date range
    result = filterEventsByDateRange(result, filters.dateRange);
    
    // Sort by timestamp (newest first)
    result = [...result].sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply max items limit
    if (maxItems) {
      result = result.slice(0, maxItems);
    }
    
    return result;
  }, [events, filters, maxItems]);
  
  const hasActiveFilters = 
    filters.types.length < Object.keys(ACTIVITY_CONFIG).length ||
    filters.dateRange !== "all";
  
  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { date: string; events: ActivityEvent[] }[] = [];
    let currentDate = "";
    
    filteredEvents.forEach(event => {
      const eventDate = format(new Date(event.timestamp * 1000), "yyyy-MM-dd");
      
      if (eventDate !== currentDate) {
        currentDate = eventDate;
        groups.push({
          date: eventDate,
          events: [event],
        });
      } else {
        groups[groups.length - 1].events.push(event);
      }
    });
    
    return groups;
  }, [filteredEvents]);
  
  const formatDateHeader = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === format(today, "yyyy-MM-dd")) return "Today";
    if (dateStr === format(yesterday, "yyyy-MM-dd")) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      {showFilters && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Activity</h2>
            <p className="text-sm text-muted-foreground">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
              {hasActiveFilters && " (filtered)"}
            </p>
          </div>
          <FilterDropdown filters={filters} onChange={setFilters} />
        </div>
      )}
      
      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 bg-card border border-border rounded-xl animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-secondary" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-secondary rounded" />
                <div className="h-3 w-1/4 bg-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} />
      ) : (
        <div className="space-y-6">
          {groupedEvents.map(group => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {formatDateHeader(group.date)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              {/* Events */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {group.events.map(event => (
                    <ActivityItem
                      key={event.id}
                      event={event}
                      currentUserAddress={currentUserAddress}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
          
          {/* Load More */}
          {hasMore && onLoadMore && (
            <div className="text-center pt-4">
              <button
                onClick={onLoadMore}
                className="px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/*//////////////////////////////////////////////////////////////
                        COMPACT VARIANT
//////////////////////////////////////////////////////////////*/

export function ActivityTimelineCompact({
  events,
  currentUserAddress,
  maxItems = 5,
  onViewAll,
}: {
  events: ActivityEvent[];
  currentUserAddress?: string;
  maxItems?: number;
  onViewAll?: () => void;
}) {
  const recentEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxItems);
  }, [events, maxItems]);
  
  if (recentEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {recentEvents.map(event => {
        const config = ACTIVITY_CONFIG[event.type];
        const Icon = config.icon;
        const description = getActivityDescription(event, currentUserAddress);
        
        return (
          <div key={event.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{description}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(event.timestamp * 1000), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
      
      {onViewAll && events.length > maxItems && (
        <button
          onClick={onViewAll}
          className="w-full py-2 text-sm text-primary hover:underline"
        >
          View all activity
        </button>
      )}
    </div>
  );
}
