import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { config } from './config';
import { initDatabase } from './config/database';
import { initElasticsearch } from './config/elasticsearch';
import { getRedisClient } from './config/redis';
import { configurePassport } from './middleware/passport';
import { getEmailQueue } from './services/queueService';
import { startWorker } from './services/workerService';
import { reconcileJobsOnStartup } from './services/reconcileService';

import authRoutes from './routes/auth';
import emailRoutes from './routes/email';
import slackRoutes from './routes/slack';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const RedisStore = require('connect-redis').default;
app.use(
  session({
    store: new RedisStore({ client: getRedisClient() }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Bull Board — live queue monitor
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/queue');
createBullBoard({ queues: [new BullMQAdapter(getEmailQueue())], serverAdapter });
app.use('/api/queue', serverAdapter.getRouter());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/slack', slackRoutes);

// Root — API info
app.get('/', (_req, res) => {
  res.json({
    name: 'ReachInbox Email Scheduler API',
    version: '1.0.0',
    endpoints: {
      health:   'GET  /api/health',
      schedule: 'POST /api/email/schedule',
      jobs:     'GET  /api/email/scheduled  |  /api/email/sent',
      stats:    'GET  /api/email/stats',
      search:   'GET  /api/email/search?q=term',
      queue:    'GET  /api/queue  (Bull Board)',
    },
    dashboard: 'http://localhost:3000',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[App] Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function bootstrap(): Promise<void> {
  try {
    await initDatabase();
    await initElasticsearch().catch((err) =>
      console.warn('[App] Elasticsearch unavailable — search disabled:', err.message)
    );
    startWorker();
    await reconcileJobsOnStartup().catch((err) =>
      console.error('[App] Reconciliation error:', err)
    );
    app.listen(config.port, () => {
      console.log(`\n🚀 ReachInbox backend on http://localhost:${config.port}`);
      console.log(`📊 Bull Board:  http://localhost:${config.port}/api/queue`);
      console.log(`❤️  Health:     http://localhost:${config.port}/api/health\n`);
    });
  } catch (err) {
    console.error('[App] Startup failed:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => { console.log('[App] Shutting down'); process.exit(0); });
process.on('SIGINT', () => { console.log('[App] Shutting down'); process.exit(0); });

bootstrap();

export default app;
