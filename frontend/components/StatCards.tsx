'use client';

import { Mail, Clock, Send, TrendingUp } from 'lucide-react';
import type { EmailStats } from '@/lib/api';

interface StatCardsProps {
  stats: EmailStats | null;
  loading: boolean;
}

export function StatCards({ stats, loading }: StatCardsProps) {
  const cards = [
    {
      label: 'Total Emails',
      value: stats?.total ?? 0,
      icon: Mail,
      color: 'from-violet-600/20 to-violet-600/5 border-violet-500/20',
      iconColor: 'text-violet-400 bg-violet-500/10',
    },
    {
      label: 'Scheduled',
      value: stats?.scheduled ?? 0,
      icon: Clock,
      color: 'from-blue-600/20 to-blue-600/5 border-blue-500/20',
      iconColor: 'text-blue-400 bg-blue-500/10',
    },
    {
      label: 'Sent',
      value: stats?.sent ?? 0,
      icon: Send,
      color: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20',
      iconColor: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      label: 'Failed',
      value: stats?.failed ?? 0,
      icon: TrendingUp,
      color: 'from-red-600/20 to-red-600/5 border-red-500/20',
      iconColor: 'text-red-400 bg-red-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${card.color}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {card.label}
              </p>
              {loading ? (
                <div className="mt-2 h-8 w-16 rounded-lg bg-white/5 animate-pulse" />
              ) : (
                <p className="mt-1 text-3xl font-bold text-white">
                  {card.value.toLocaleString()}
                </p>
              )}
            </div>
            <div className={`p-2.5 rounded-xl ${card.iconColor}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
