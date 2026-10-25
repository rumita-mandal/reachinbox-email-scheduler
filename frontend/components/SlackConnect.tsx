'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from './ui/Button';
import { toast } from './ui/Toast';
import { Slack, Check, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export function SlackConnect() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    api
      .getSlackStatus()
      .then((s) => setConnected(s.connected))
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));
  }, []);

  // Handle slack_connected/slack_error query params after OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slack_connected') === 'true') {
      setConnected(true);
      toast('Slack connected successfully!', 'success');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('slack_error')) {
      toast(`Slack connection failed: ${params.get('slack_error')}`, 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = () => {
    window.location.href = `${API_BASE_URL}/api/slack/connect`;
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.disconnectSlack();
      setConnected(false);
      toast('Slack disconnected', 'info');
    } catch {
      toast('Failed to disconnect Slack', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 w-40 animate-pulse">
        <div className="w-4 h-4 rounded bg-white/10" />
        <div className="h-3 w-20 rounded bg-white/10" />
      </div>
    );
  }

  return connected ? (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="w-4 h-4 rounded bg-[#4A154B] flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">S</span>
        </div>
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-medium text-emerald-400">Slack Connected</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDisconnect}
        loading={disconnecting}
        leftIcon={<X className="w-3.5 h-3.5" />}
      >
        Disconnect
      </Button>
    </div>
  ) : (
    <Button
      variant="secondary"
      size="sm"
      id="slack-connect-button"
      onClick={handleConnect}
      leftIcon={
        <div className="w-4 h-4 rounded bg-[#4A154B] flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">S</span>
        </div>
      }
    >
      Connect Slack
    </Button>
  );
}
