export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface EmailJob {
  id: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  status: 'pending' | 'scheduled' | 'sent' | 'failed' | 'rate_limited';
  bullJobId: string | null;
  sentAt: string | null;
  errorMessage: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  slackConnected: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ScheduleEmailPayload {
  subject: string;
  body: string;
  recipients?: string[];
  csvFile?: File;
  startTime: string;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
  senderEmail?: string;
  senderName?: string;
}

export interface EmailStats {
  scheduled: number;
  sent: number;
  failed: number;
  total: number;
}

export interface SearchResult {
  hits: EmailJob[];
  total: number;
}

// ─── API Client Functions ─────────────────────────────────────────────────────

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  getMe: () => fetchApi<User>('/api/auth/me'),
  logout: () => fetchApi<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  // Email
  getScheduled: (page = 1, limit = 20) =>
    fetchApi<PaginatedResponse<EmailJob>>(`/api/email/scheduled?page=${page}&limit=${limit}`),

  getSent: (page = 1, limit = 20) =>
    fetchApi<PaginatedResponse<EmailJob>>(`/api/email/sent?page=${page}&limit=${limit}`),

  getStats: () => fetchApi<EmailStats>('/api/email/stats'),

  search: (q: string, from = 0) =>
    fetchApi<SearchResult>(`/api/email/search?q=${encodeURIComponent(q)}&from=${from}`),

  scheduleEmails: async (payload: ScheduleEmailPayload) => {
    const formData = new FormData();
    formData.append('subject', payload.subject);
    formData.append('body', payload.body);
    formData.append('startTime', payload.startTime);
    formData.append('delayBetweenEmailsMs', String(payload.delayBetweenEmailsMs));
    formData.append('hourlyLimit', String(payload.hourlyLimit));
    if (payload.senderEmail) formData.append('senderEmail', payload.senderEmail);
    if (payload.senderName) formData.append('senderName', payload.senderName);

    if (payload.csvFile) {
      formData.append('recipients', payload.csvFile);
    } else if (payload.recipients) {
      formData.append('recipients', JSON.stringify(payload.recipients));
    }

    const res = await fetch(`${API_BASE_URL}/api/email/schedule`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },

  // Slack
  getSlackStatus: () => fetchApi<{ connected: boolean; teamId: string | null }>('/api/slack/status'),
  disconnectSlack: () => fetchApi<{ success: boolean }>('/api/slack/disconnect', { method: 'DELETE' }),
};
