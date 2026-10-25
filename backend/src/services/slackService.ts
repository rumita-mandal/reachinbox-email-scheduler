import { WebClient } from '@slack/web-api';

export interface SlackRateLimitNotification {
  accessToken: string;
  senderEmail: string;
  currentCount: number;
  limit: number;
}

/**
 * Sends a Slack message to the user's workspace when rate limit is hit.
 * Uses the stored OAuth access token — no hardcoded webhook URLs.
 */
export async function notifySlackRateLimit({
  accessToken,
  senderEmail,
  currentCount,
  limit,
}: SlackRateLimitNotification): Promise<void> {
  const client = new WebClient(accessToken);

  const message = [
    `🚨 *Rate Limit Reached*`,
    ``,
    `Sender: \`${senderEmail}\``,
    `Emails sent this hour: *${currentCount}* / ${limit}`,
    ``,
    `Further emails from this sender are being delayed to the next hour window to avoid drops. They will resume automatically — no action needed.`,
    ``,
    `_ReachInbox Email Scheduler_`,
  ].join('\n');

  // Post to the user's Slack as a DM or to a default channel
  await client.chat.postMessage({
    channel: '#general', // Falls back to #general; can be customized per user
    text: message,
    mrkdwn: true,
  });

  console.log('[Slack] Rate limit notification sent for sender:', senderEmail);
}

/**
 * Validates a Slack access token by calling auth.test
 */
export async function validateSlackToken(accessToken: string): Promise<{
  ok: boolean;
  teamId?: string;
  userId?: string;
  teamName?: string;
}> {
  const client = new WebClient(accessToken);
  const result = await client.auth.test();
  return {
    ok: result.ok,
    teamId: result.team_id as string | undefined,
    userId: result.user_id as string | undefined,
    teamName: result.team as string | undefined,
  };
}
