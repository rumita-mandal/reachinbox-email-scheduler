import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { AppDataSource } from '../config/database';
import { EmailJob } from '../models/EmailJob';
import { EmailJobPayload } from '../types';
import { sendEmail } from './emailService';
import { checkAndIncrementRateLimit, decrementRateLimit } from './rateLimitService';
import { rescheduleToNextHour } from './queueService';
import { indexEmailJob, updateEmailJobStatus } from './elasticsearchService';
import { config } from '../config';
import { EMAIL_QUEUE_NAME } from './queueService';

let worker: Worker<EmailJobPayload> | null = null;

async function processEmailJob(job: Job<EmailJobPayload>): Promise<void> {
  const payload = job.data;
  const { jobId, senderEmail, recipientEmail, userId } = payload;

  console.log(`[Worker] Processing job ${job.id} → ${recipientEmail}`);

  const repo = AppDataSource.getRepository(EmailJob);
  const emailJob = await repo.findOne({ where: { id: jobId } });

  if (!emailJob) {
    console.warn(`[Worker] Job ${jobId} not found in DB — skipping`);
    return;
  }

  if (emailJob.status === 'sent') {
    console.log(`[Worker] Job ${jobId} already sent — skipping`);
    return;
  }

  const redis = getRedisClient();
  const rateCheck = await checkAndIncrementRateLimit(redis, senderEmail, userId, config.maxEmailsPerHourPerSender);

  if (!rateCheck.allowed) {
    console.log(`[Worker] Rate limit hit for ${senderEmail} — rescheduling to next hour`);
    await decrementRateLimit(redis, senderEmail);
    await rescheduleToNextHour(payload, rateCheck.nextWindowMs);
    await repo.update(jobId, { status: 'rate_limited', bullJobId: job.id as string });
    await updateEmailJobStatus(jobId, 'rate_limited');
    return;
  }

  await sleep(config.minDelayBetweenEmailsMs);
  await repo.update(jobId, { status: 'scheduled', bullJobId: job.id as string });

  try {
    const result = await sendEmail(payload);
    const sentAt = new Date();

    await repo.update(jobId, { status: 'sent', sentAt, errorMessage: null });

    const updated = await repo.findOne({ where: { id: jobId } });
    if (updated) {
      await indexEmailJob(updated).catch((err) =>
        console.error('[Worker] ES index error (non-fatal):', err.message)
      );
    }
    await updateEmailJobStatus(jobId, 'sent', sentAt).catch(() => {});

    console.log(`[Worker] ✓ Sent ${jobId} → ${recipientEmail} | Preview: ${result.previewUrl}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await repo.update(jobId, { status: 'failed', errorMessage: msg });
    await updateEmailJobStatus(jobId, 'failed').catch(() => {});
    console.error(`[Worker] ✗ Failed ${jobId} → ${recipientEmail}:`, msg);
    throw err;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startWorker(): Worker<EmailJobPayload> {
  if (worker) return worker;

  worker = new Worker<EmailJobPayload>(EMAIL_QUEUE_NAME, processEmailJob, {
    connection: getRedisClient(),
    concurrency: config.workerConcurrency,
    limiter: {
      max: 1,
      duration: config.minDelayBetweenEmailsMs,
    },
  });

  worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message));
  worker.on('error', (err) => console.error('[Worker] Worker error:', err.message));

  console.log(
    `[Worker] Started with concurrency=${config.workerConcurrency}, ` +
    `minDelay=${config.minDelayBetweenEmailsMs}ms, maxPerHour=${config.maxEmailsPerHourPerSender}`
  );

  return worker;
}

export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('[Worker] Stopped');
  }
}
