import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database';
import { EmailJob } from '../models/EmailJob';
import { scheduleEmailJob } from '../services/queueService';
import { indexEmailJob, searchEmailJobs, updateEmailJobStatus } from '../services/elasticsearchService';
import { config } from '../config';

// POST /api/email/schedule
export async function scheduleEmails(req: Request, res: Response): Promise<void> {
  try {
    const { subject, body, startTime, delayBetweenEmailsMs, hourlyLimit, senderEmail, senderName } = req.body;

    if (!subject || !body || !startTime) {
      res.status(400).json({ error: 'subject, body, and startTime are required' });
      return;
    }

    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let recipients: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (req.file) {
      const records = parse(req.file.buffer.toString('utf-8'), {
        skip_empty_lines: true,
        trim: true,
      }) as string[][];

      for (const row of records) {
        for (const cell of row) {
          if (emailRegex.test(cell.trim())) {
            recipients.push(cell.trim().toLowerCase());
          }
        }
      }
    } else if (req.body.recipients) {
      recipients =
        typeof req.body.recipients === 'string'
          ? JSON.parse(req.body.recipients)
          : req.body.recipients;
    }

    if (recipients.length === 0) {
      res.status(400).json({ error: 'No valid email recipients found' });
      return;
    }

    recipients = [...new Set(recipients)];

    const delayMs = parseInt(delayBetweenEmailsMs || String(config.minDelayBetweenEmailsMs), 10);
    const startTimestamp = new Date(startTime).getTime();
    const repo = AppDataSource.getRepository(EmailJob);
    const scheduled: { id: string; recipient: string; scheduledAt: Date }[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipientEmail = recipients[i];
      const scheduledAt = new Date(startTimestamp + i * delayMs);
      const jobId = uuidv4();

      const emailJob = repo.create({
        id: jobId,
        senderEmail: senderEmail || 'noreply@reachinbox.ai',
        senderName: senderName || 'ReachInbox',
        recipientEmail,
        subject,
        body,
        scheduledAt,
        status: 'pending',
        userId,
      });

      await repo.save(emailJob);

      const bullJobId = await scheduleEmailJob(
        {
          jobId,
          senderEmail: emailJob.senderEmail,
          senderName: emailJob.senderName,
          recipientEmail,
          subject,
          body,
          scheduledAt: scheduledAt.toISOString(),
          userId,
        },
        scheduledAt
      );

      await repo.update(jobId, { status: 'scheduled', bullJobId });
      emailJob.bullJobId = bullJobId;
      emailJob.status = 'scheduled';

      indexEmailJob(emailJob).catch((err) =>
        console.error('[Controller] ES index error:', err.message)
      );

      scheduled.push({ id: jobId, recipient: recipientEmail, scheduledAt });
    }

    res.status(201).json({ success: true, scheduledCount: scheduled.length, jobs: scheduled });
  } catch (err) {
    console.error('[Controller] scheduleEmails error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/email/scheduled
export async function getScheduledEmails(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const skip = (page - 1) * limit;

    const repo = AppDataSource.getRepository(EmailJob);
    const [jobs, total] = await repo.findAndCount({
      where: [
        { userId, status: 'pending' },
        { userId, status: 'scheduled' },
        { userId, status: 'rate_limited' },
      ],
      order: { scheduledAt: 'ASC' },
      skip,
      take: limit,
    });

    res.json({ data: jobs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Controller] getScheduledEmails error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/email/sent
export async function getSentEmails(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const skip = (page - 1) * limit;

    const repo = AppDataSource.getRepository(EmailJob);
    const [jobs, total] = await repo.findAndCount({
      where: [{ userId, status: 'sent' }, { userId, status: 'failed' }],
      order: { sentAt: 'DESC' },
      skip,
      take: limit,
    });

    res.json({ data: jobs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Controller] getSentEmails error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/email/search?q=query
export async function searchEmails(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const query = req.query.q as string;
    if (!query?.trim()) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    const from = parseInt((req.query.from as string) || '0', 10);
    const size = parseInt((req.query.size as string) || '20', 10);
    const result = await searchEmailJobs(query, userId, from, size);

    res.json({ hits: result.hits, total: result.total });
  } catch (err) {
    console.error('[Controller] searchEmails error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
}

// GET /api/email/stats
export async function getEmailStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const repo = AppDataSource.getRepository(EmailJob);
    const [scheduled, sent, failed, total] = await Promise.all([
      repo.count({ where: [{ userId, status: 'scheduled' }, { userId, status: 'pending' }] }),
      repo.count({ where: { userId, status: 'sent' } }),
      repo.count({ where: { userId, status: 'failed' } }),
      repo.count({ where: { userId } }),
    ]);

    res.json({ scheduled, sent, failed, total });
  } catch (err) {
    console.error('[Controller] getEmailStats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
