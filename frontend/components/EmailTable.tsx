'use client';

import { EmailJob } from '@/lib/api';
import { StatusBadge } from './ui/Badge';
import { Mail, Inbox, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface EmailTableProps {
  emails: EmailJob[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  type: 'scheduled' | 'sent';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 rounded bg-white/5 animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

function EmptyState({ type }: { type: 'scheduled' | 'sent' }) {
  return (
    <tr>
      <td colSpan={5} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
            {type === 'scheduled' ? (
              <Inbox className="w-7 h-7 text-gray-500" />
            ) : (
              <Mail className="w-7 h-7 text-gray-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">
              {type === 'scheduled'
                ? 'No scheduled emails'
                : 'No sent emails yet'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {type === 'scheduled'
                ? 'Click "Compose New Email" to schedule your first campaign'
                : 'Sent emails will appear here once delivered'}
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function EmailTable({
  emails,
  total,
  page,
  totalPages,
  loading,
  onPageChange,
  onRefresh,
  type,
}: EmailTableProps) {
  const columns =
    type === 'scheduled'
      ? ['Recipient', 'Subject', 'Sender', 'Scheduled At', 'Status']
      : ['Recipient', 'Subject', 'Sender', 'Sent At', 'Status'];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/2 overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-white">{total.toLocaleString()}</span> emails
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : emails.length === 0 ? (
              <EmptyState type={type} />
            ) : (
              emails.map((email) => (
                <tr
                  key={email.id}
                  className="hover:bg-white/2 transition-colors group"
                >
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-200 font-medium">
                      {email.recipientEmail}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <span className="text-sm text-gray-300 truncate block">
                      {email.subject}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-400">{email.senderEmail}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-400">
                      {type === 'scheduled'
                        ? formatDate(email.scheduledAt)
                        : formatDate(email.sentAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={email.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
