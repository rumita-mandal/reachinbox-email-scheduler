'use client';

type BadgeStatus = 'pending' | 'scheduled' | 'sent' | 'failed' | 'rate_limited';

const statusConfig: Record<
  BadgeStatus,
  { label: string; color: string; dot: string }
> = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    dot: 'bg-yellow-400',
  },
  scheduled: {
    label: 'Scheduled',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400 animate-pulse',
  },
  sent: {
    label: 'Sent',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
    dot: 'bg-red-400',
  },
  rate_limited: {
    label: 'Rate Limited',
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    dot: 'bg-orange-400',
  },
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const cfg = statusConfig[status] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function Badge({
  children,
  color = 'default',
}: {
  children: React.ReactNode;
  color?: 'default' | 'violet' | 'emerald' | 'red' | 'blue';
}) {
  const colors = {
    default: 'bg-white/5 text-gray-400 border-white/10',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colors[color]}`}
    >
      {children}
    </span>
  );
}
