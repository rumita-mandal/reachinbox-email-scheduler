import { Client } from '@elastic/elasticsearch';
import { config } from './index';

let esClient: Client | null = null;

export function getElasticsearchClient(): Client {
  if (!esClient) {
    esClient = new Client({ node: config.elasticsearchUrl });
  }
  return esClient;
}

export const EMAIL_INDEX = 'email_jobs';

export async function initElasticsearch(): Promise<void> {
  const client = getElasticsearchClient();

  try {
    const indexExists = await client.indices.exists({ index: EMAIL_INDEX });

    if (!indexExists) {
      await client.indices.create({
        index: EMAIL_INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            senderEmail: { type: 'keyword' },
            senderName: { type: 'text' },
            recipientEmail: { type: 'keyword' },
            subject: { type: 'text', analyzer: 'standard' },
            body: { type: 'text', analyzer: 'standard' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
            userId: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      });
      console.log('[Elasticsearch] Index created:', EMAIL_INDEX);
    } else {
      console.log('[Elasticsearch] Index already exists:', EMAIL_INDEX);
    }
  } catch (err) {
    console.error('[Elasticsearch] Init error (non-fatal):', err);
  }
}
