'use client';

import { useState } from 'react';
import { useAuth, useEmailStats, useScheduledEmails, useSentEmails } from '@/hooks/useEmails';
import { Header } from '@/components/Header';
import { StatCards } from '@/components/StatCards';
import { EmailTable } from '@/components/EmailTable';
import { ComposeModal } from '@/components/ComposeModal';
import { SlackConnect } from '@/components/SlackConnect';
import { Button } from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/Toast';
import { PenLine, Clock, Send, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

type Tab = 'scheduled' | 'sent';

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { stats, loading: statsLoading, refresh: refreshStats } = useEmailStats();
  const [activeTab, setActiveTab] = useState<Tab>('scheduled');
  const [composeOpen, setComposeOpen] = useState(false);

  const scheduledEmails = useScheduledEmails();
  const sentEmails = useSentEmails();

  const handleComposeSuccess = () => {
    refreshStats();
    scheduledEmails.refresh();
  };

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    if (typeof window !== 'undefined') window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a]">
      <Header user={user} onLogout={logout} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Page Title + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Email Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your scheduled and sent email campaigns
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <SlackConnect />
            <a
              href={`${API_BASE_URL}/api/queue`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Bull Board
            </a>
            <Button
              id="compose-button"
              onClick={() => setComposeOpen(true)}
              leftIcon={<PenLine className="w-4 h-4" />}
              size="md"
            >
              Compose New Email
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <StatCards stats={stats} loading={statsLoading} />

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 w-fit border border-white/10">
            <button
              id="tab-scheduled"
              onClick={() => setActiveTab('scheduled')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'scheduled'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              Scheduled
              {stats && stats.scheduled > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                  {stats.scheduled}
                </span>
              )}
            </button>
            <button
              id="tab-sent"
              onClick={() => setActiveTab('sent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'sent'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Send className="w-4 h-4" />
              Sent
              {stats && stats.sent > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                  {stats.sent}
                </span>
              )}
            </button>
          </div>

          {/* Email Tables */}
          {activeTab === 'scheduled' && (
            <EmailTable
              emails={scheduledEmails.data?.data ?? []}
              total={scheduledEmails.data?.total ?? 0}
              page={scheduledEmails.page}
              totalPages={scheduledEmails.data?.totalPages ?? 1}
              loading={scheduledEmails.loading}
              onPageChange={(p) => {
                scheduledEmails.setPage(p);
                scheduledEmails.refresh(p);
              }}
              onRefresh={() => scheduledEmails.refresh()}
              type="scheduled"
            />
          )}

          {activeTab === 'sent' && (
            <EmailTable
              emails={sentEmails.data?.data ?? []}
              total={sentEmails.data?.total ?? 0}
              page={sentEmails.page}
              totalPages={sentEmails.data?.totalPages ?? 1}
              loading={sentEmails.loading}
              onPageChange={(p) => {
                sentEmails.setPage(p);
                sentEmails.refresh(p);
              }}
              onRefresh={() => sentEmails.refresh()}
              type="sent"
            />
          )}
        </div>
      </main>

      <ComposeModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSuccess={handleComposeSuccess}
      />

      <ToastContainer />
    </div>
  );
}
