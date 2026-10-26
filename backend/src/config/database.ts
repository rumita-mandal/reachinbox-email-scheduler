import { DataSource } from 'typeorm';
import { config } from './index';
import { EmailJob } from '../models/EmailJob';
import { User } from '../models/User';
export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: config.db.host,
        port: config.db.port,
        username: config.db.username,
        password: config.db.password,
        database: config.db.database,
      }),
  synchronize: true,
  logging: config.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  entities: [EmailJob, User],
});

export async function initDatabase(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('[DB] Connected to PostgreSQL');
  }
}
