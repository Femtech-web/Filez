"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  User,
  Clock,
  CalendarClock,
  Eye,
  Check,
  UserX,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SharesPanelProps {
  shares: any[];
  fileId: string;
  onRevoke: (recipient: string) => Promise<void>;
  onExtend: (share: any) => void;
  isRevoking: boolean;
  revokingRecipient: string | null;
}

export function SharesPanel({
  shares,
  fileId,
  onRevoke,
  onExtend,
  isRevoking,
  revokingRecipient,
}: SharesPanelProps) {
  const activeCount = shares.filter((s: any) => !s.isRevoked && !s.isExpired).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card border border-border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Shared With
        </h2>
        <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
          {activeCount} active
        </span>
      </div>

      <div className="space-y-3">
        {shares.map((share: any) => {
          const isExpired =
            share.isExpired ||
            (share.expiresAt > 0 &&
              share.expiresAt < Math.floor(Date.now() / 1000));
          const isActive = !share.isRevoked && !isExpired;

          return (
            <div
              key={share.id}
              className={`p-4 rounded-xl border transition-all ${
                isActive
                  ? "bg-secondary/30 border-border"
                  : "bg-secondary/10 border-border/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="font-mono text-sm text-foreground truncate">
                      {share.recipient}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>
                        Shared{" "}
                        {formatDistanceToNow(
                          new Date(share.sharedAt * 1000),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>

                    {share.expiresAt > 0 && (
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-3 h-3" />
                        <span className={isExpired ? "text-orange-400" : ""}>
                          {isExpired ? "Expired" : "Expires"}{" "}
                          {new Date(
                            share.expiresAt * 1000
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {share.accessCount > 0 && (
                      <div className="flex items-center gap-2">
                        <Eye className="w-3 h-3" />
                        <span>
                          Accessed {share.accessCount}{" "}
                          {share.accessCount === 1 ? "time" : "times"}
                        </span>
                      </div>
                    )}

                    {share.lastAccessedAt && (
                      <div className="text-xs text-muted-foreground/70">
                        Last accessed{" "}
                        {formatDistanceToNow(
                          new Date(share.lastAccessedAt * 1000),
                          { addSuffix: true }
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {share.isRevoked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 text-xs font-medium rounded-full">
                        <UserX className="w-3 h-3" />
                        Revoked
                      </span>
                    )}
                    {isExpired && !share.isRevoked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs font-medium rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Expired
                      </span>
                    )}
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>
                </div>

                {isActive && (
                  <div className="flex flex-col gap-2">
                    {share.expiresAt > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onExtend(share)}
                        className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-xs font-medium whitespace-nowrap"
                      >
                        Extend
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onRevoke(share.recipient)}
                      disabled={
                        isRevoking && revokingRecipient === share.recipient
                      }
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-xs font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isRevoking && revokingRecipient === share.recipient ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Revoking...
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3" />
                          Revoke
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {shares.every((s: any) => s.isRevoked || s.isExpired) && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">No active shares</p>
          <p className="text-xs text-muted-foreground/70">
            All shares have been revoked or expired
          </p>
        </div>
      )}
    </motion.div>
  );
}
