import { Queue, QueueEvents } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { EmailJobPayload } from '../types';
import { config } from '../config';

export const EMAIL_QUEUE_NAME = 'email-send';

let emailQueue: Queue<EmailJobPayload> | null = null;
let emailQueueEvents: QueueEvents | null = null;

/**
 * Returns the singleton BullMQ Queue instance.
 * BullMQ stores jobs in Redis — they survive server restarts automatically.
 */
export function getEmailQueue(): Queue<EmailJobPayload> {
  if (!emailQueue) {
    const connection = getRedisClient();
    emailQueue = new Queue<EmailJobPayload>(EMAIL_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: false, // Keep completed jobs for dashboard visibility
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });
    console.log('[Queue] Email queue initialized');
  }
  return emailQueue;
}

export function getEmailQueueEvents(): QueueEvents {
  if (!emailQueueEvents) {
    const connection = getRedisClient();
    emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, { connection });
  }
  return emailQueueEvents;
}

/**
 * Schedules a single email as a BullMQ delayed job.
 *
 * Key design decisions:
 * - jobId = DB UUID: BullMQ deduplicates by jobId, preventing duplicate sends
 * - delay = ms until scheduledAt: BullMQ persists this in Redis
 * - After server restart, Redis still has the delayed job → still fires on time
 */
export async function scheduleEmailJob(
  payload: EmailJobPayload,
  scheduledAt: Date
): Promise<string> {
  const queue = getEmailQueue();
  const now = Date.now();
  const delay = Math.max(0, scheduledAt.getTime() - now);

  const job = await queue.add(EMAIL_QUEUE_NAME, payload, {
    jobId: payload.jobId, // Idempotency: same jobId won't be added twice
    delay,
  });

  console.log(
    `[Queue] Scheduled email job ${job.id} for ${payload.recipientEmail} at ${scheduledAt.toISOString()} (delay: ${delay}ms)`
  );

  return job.id as string;
}

/**
 * Reschedules a job to the next hour window (used when rate limit is exceeded).
 */
export async function rescheduleToNextHour(
  payload: EmailJobPayload,
  nextWindowMs: number
): Promise<string> {
  const queue = getEmailQueue();
  const delay = Math.max(0, nextWindowMs - Date.now());

  // Remove old job first (if it exists) to avoid duplicates
  const existingJob = await queue.getJob(payload.jobId);
  if (existingJob) {
    await existingJob.remove();
  }

  // Use a new jobId with a suffix to avoid BullMQ deduplification blocking re-add
  const newJobId = `${payload.jobId}:rescheduled:${Date.now()}`;
  const job = await queue.add(EMAIL_QUEUE_NAME, payload, {
    jobId: newJobId,
    delay,
  });

  console.log(
    `[Queue] Rescheduled job ${newJobId} to next hour window (delay: ${delay}ms)`
  );

  return job.id as string;
}

/**
 * Gets queue stats for the dashboard.
 */
export async function getQueueStats() {
  const queue = getEmailQueue();
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

export async function closeQueue(): Promise<void> {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
  }
}
