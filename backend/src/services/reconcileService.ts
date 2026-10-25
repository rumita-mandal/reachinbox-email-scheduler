import { AppDataSource } from '../config/database';
import { EmailJob } from '../models/EmailJob';
import { scheduleEmailJob } from './queueService';

/**
 * On server restart, reconciles the DB with BullMQ Redis state.
 *
 * Problem: If the server crashes/restarts, future delayed jobs in BullMQ
 * (stored in Redis) are still intact. BUT any 'pending' jobs that haven't
 * been added to BullMQ yet need to be re-queued.
 *
 * Strategy:
 * - Jobs with status='pending' were created in DB but BullMQ job was never confirmed
 * - Re-add them to BullMQ. BullMQ jobId deduplication prevents double-sends.
 * - Jobs with status='scheduled' are already in Redis (BullMQ delayed) — no action needed.
 * - Jobs with status='sent'/'failed' — already done, skip.
 */
export async function reconcileJobsOnStartup(): Promise<void> {
  const emailJobRepo = AppDataSource.getRepository(EmailJob);

  // Find all pending jobs (not yet queued or queue confirmation was lost)
  const pendingJobs = await emailJobRepo.find({
    where: { status: 'pending' },
    order: { scheduledAt: 'ASC' },
  });

  // Also find rate_limited jobs that need to be re-queued
  const rateLimitedJobs = await emailJobRepo.find({
    where: { status: 'rate_limited' },
    order: { scheduledAt: 'ASC' },
  });

  const jobsToReconcile = [...pendingJobs, ...rateLimitedJobs];

  if (jobsToReconcile.length === 0) {
    console.log('[Reconcile] No pending jobs to reconcile');
    return;
  }

  console.log(`[Reconcile] Reconciling ${jobsToReconcile.length} jobs...`);

  for (const job of jobsToReconcile) {
    try {
      const bullJobId = await scheduleEmailJob(
        {
          jobId: job.id,
          senderEmail: job.senderEmail,
          senderName: job.senderName,
          recipientEmail: job.recipientEmail,
          subject: job.subject,
          body: job.body,
          scheduledAt: job.scheduledAt.toISOString(),
          userId: job.userId,
        },
        job.scheduledAt
      );

      await emailJobRepo.update(job.id, {
        status: 'scheduled',
        bullJobId,
      });

      console.log(`[Reconcile] Re-queued job ${job.id} for ${job.recipientEmail}`);
    } catch (err) {
      console.error(`[Reconcile] Failed to re-queue job ${job.id}:`, err);
    }
  }

  console.log('[Reconcile] Complete');
}
