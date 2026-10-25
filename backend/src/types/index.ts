// Shared TypeScript types across the backend

export interface EmailJobPayload {
  jobId: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  userId: string;
}

export interface ScheduleEmailRequest {
  subject: string;
  body: string;
  recipients: string[];
  senderEmail?: string;
  senderName?: string;
  startTime: string; // ISO timestamp for first email
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
  userId: string;
}

export type EmailStatus = 'pending' | 'scheduled' | 'sent' | 'failed' | 'rate_limited';

export interface EmailJobRecord {
  id: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  status: EmailStatus;
  bullJobId: string | null;
  sentAt: Date | null;
  errorMessage: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRecord {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  slackAccessToken: string | null;
  slackTeamId: string | null;
  slackUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RateLimitState {
  count: number;
  windowKey: string;
  limit: number;
  exceeded: boolean;
}
