import { getElasticsearchClient, EMAIL_INDEX } from '../config/elasticsearch';
import { EmailJob } from '../models/EmailJob';

export interface EmailSearchResult {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
}

/**
 * Indexes or updates an email job document in Elasticsearch.
 */
export async function indexEmailJob(job: EmailJob): Promise<void> {
  const client = getElasticsearchClient();

  await client.index({
    index: EMAIL_INDEX,
    id: job.id,
    document: {
      id: job.id,
      senderEmail: job.senderEmail,
      senderName: job.senderName,
      recipientEmail: job.recipientEmail,
      subject: job.subject,
      body: job.body,
      status: job.status,
      scheduledAt: job.scheduledAt.toISOString(),
      sentAt: job.sentAt ? job.sentAt.toISOString() : null,
      userId: job.userId,
      createdAt: job.createdAt.toISOString(),
    },
  });
}

/**
 * Updates the status of an indexed email job.
 */
export async function updateEmailJobStatus(
  id: string,
  status: string,
  sentAt?: Date
): Promise<void> {
  const client = getElasticsearchClient();

  await client.update({
    index: EMAIL_INDEX,
    id,
    doc: {
      status,
      ...(sentAt && { sentAt: sentAt.toISOString() }),
    },
  });
}

/**
 * Full-text search across email jobs.
 */
export async function searchEmailJobs(
  query: string,
  userId: string,
  from = 0,
  size = 20
): Promise<{ hits: EmailSearchResult[]; total: number }> {
  const client = getElasticsearchClient();

  const response = await client.search({
    index: EMAIL_INDEX,
    from,
    size,
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ['subject^3', 'body', 'recipientEmail^2', 'senderEmail'],
              fuzziness: 'AUTO',
            },
          },
          { term: { userId } },
        ],
      },
    },
    sort: [{ scheduledAt: { order: 'desc' } }],
  });

  const total =
    typeof response.hits.total === 'number'
      ? response.hits.total
      : response.hits.total?.value ?? 0;

  const hits = response.hits.hits
    .map((hit) => hit._source as EmailSearchResult | undefined)
    .filter((h): h is EmailSearchResult => h !== undefined);

  return { hits, total };
}
