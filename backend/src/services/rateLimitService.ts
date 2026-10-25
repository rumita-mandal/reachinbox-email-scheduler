import IORedis from 'ioredis';
import { config } from '../config';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { notifySlackRateLimit } from './slackService';

const RATE_LIMIT_TTL_SECONDS = 3600; // 1 hour

/**
 * Gets the current hour window key for a sender.
 * Format: rate:hour:{senderEmail}:{YYYY-MM-DD-HH}
 */
export function getRateLimitKey(senderEmail: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  return `rate:hour:${senderEmail}:${year}-${month}-${day}-${hour}`;
}

/**
 * Gets the timestamp (ms) for the start of the NEXT hour window.
 */
export function getNextHourWindowMs(): number {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
  return nextHour.getTime();
}

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  nextWindowMs: number;
}

/**
 * Atomically increments the per-sender hourly counter in Redis.
 * Uses INCR + EXPIRE for atomic, distributed-safe counting.
 *
 * @returns whether sending is allowed and the current count
 */
export async function checkAndIncrementRateLimit(
  redis: IORedis,
  senderEmail: string,
  userId: string,
  limit: number = config.maxEmailsPerHourPerSender
): Promise<RateLimitCheckResult> {
  const key = getRateLimitKey(senderEmail);

  // Pipeline: INCR then EXPIRE (atomic as a pipeline)
  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, RATE_LIMIT_TTL_SECONDS);
  const results = await pipeline.exec();

  const currentCount = (results?.[0]?.[1] as number) ?? 1;
  const nextWindowMs = getNextHourWindowMs();
  const allowed = currentCount <= limit;

  if (!allowed) {
    console.warn(
      `[RateLimit] Sender ${senderEmail} exceeded limit (${currentCount}/${limit}) — scheduling for next window`
    );
    // Fire Slack notification asynchronously (don't block the job)
    notifySlackRateLimitHit(userId, senderEmail, currentCount, limit).catch(
      (err) => console.error('[RateLimit] Slack notify error:', err)
    );
  }

  return { allowed, currentCount, limit, nextWindowMs };
}

/**
 * Reads the current count without incrementing (for informational use).
 */
export async function getRateLimitCount(
  redis: IORedis,
  senderEmail: string
): Promise<number> {
  const key = getRateLimitKey(senderEmail);
  const val = await redis.get(key);
  return val ? parseInt(val, 10) : 0;
}

/**
 * Decrements the rate limit counter (e.g. on job failure / retry).
 */
export async function decrementRateLimit(
  redis: IORedis,
  senderEmail: string
): Promise<void> {
  const key = getRateLimitKey(senderEmail);
  await redis.decr(key);
}

/**
 * Notifies the user's connected Slack when their rate limit is hit.
 * Gracefully skips if the user hasn't connected Slack.
 */
async function notifySlackRateLimitHit(
  userId: string,
  senderEmail: string,
  currentCount: number,
  limit: number
): Promise<void> {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user?.slackAccessToken) {
      // No Slack connected — silently skip
      return;
    }

    await notifySlackRateLimit({
      accessToken: user.slackAccessToken,
      senderEmail,
      currentCount,
      limit,
    });
  } catch (err) {
    console.error('[RateLimit] Failed to notify Slack:', err);
  }
}
