import 'dotenv/config';

interface Config {
  nodeEnv: string;
  port: number;

  // Database
  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };

  // Redis
  redis: {
    host: string;
    port: number;
  };

  // Elasticsearch
  elasticsearchUrl: string;

  // Session
  sessionSecret: string;

  // Google OAuth
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };

  // Frontend
  frontendUrl: string;

  // Slack OAuth
  slack: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };

  // Worker
  workerConcurrency: number;
  minDelayBetweenEmailsMs: number;

  // Rate Limiting
  maxEmailsPerHourPerSender: number;
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'reachinbox',
    password: process.env.DB_PASSWORD || 'reachinboxpass',
    database: process.env.DB_DATABASE || 'reachinbox',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',

  sessionSecret: process.env.SESSION_SECRET || 'fallback-secret-change-me',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:4000/api/auth/google/callback',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    redirectUri:
      process.env.SLACK_REDIRECT_URI ||
      'http://localhost:4000/api/slack/callback',
  },

  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  minDelayBetweenEmailsMs: parseInt(
    process.env.MIN_DELAY_BETWEEN_EMAILS_MS || '2000',
    10
  ),

  maxEmailsPerHourPerSender: parseInt(
    process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '200',
    10
  ),
};
