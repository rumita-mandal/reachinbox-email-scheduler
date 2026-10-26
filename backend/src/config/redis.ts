import IORedis from 'ioredis';
import { config } from './index';

let redisClient: IORedis | null = null;

export function getRedisClient(): IORedis {
  if (!redisClient) {
       redisClient = process.env.REDIS_URL
      ? new IORedis(process.env.REDIS_URL, {
          maxRetriesPerRequest: null, 
          enableReadyCheck: false,
        })
      : new IORedis({
          host: config.redis.host,
          port: config.redis.port,
          maxRetriesPerRequest: null, 
          enableReadyCheck: false,
        });
    redisClient.on('connect', () => console.log('[Redis] Connected'));
    redisClient.on('error', (err) => console.error('[Redis] Error:', err));
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
