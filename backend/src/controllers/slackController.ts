import { Request, Response } from 'express';
import axios from 'axios';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { config } from '../config';
import { validateSlackToken } from '../services/slackService';

/**
 * GET /api/slack/connect
 * Initiates Slack OAuth 2.0 authorization flow.
 * Redirects user to Slack's authorization page.
 */
export async function connectSlack(req: Request, res: Response): Promise<void> {
  const userId = (req.user as { id: string })?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!config.slack.clientId) {
    res.status(503).json({ error: 'Slack integration not configured' });
    return;
  }

  const scopes = ['chat:write', 'channels:read', 'auth.test'].join(',');
  const slackAuthUrl =
    `https://slack.com/oauth/v2/authorize` +
    `?client_id=${config.slack.clientId}` +
    `&scope=${scopes}` +
    `&redirect_uri=${encodeURIComponent(config.slack.redirectUri)}` +
    `&state=${userId}`; // Pass userId as state for callback

  res.redirect(slackAuthUrl);
}

/**
 * GET /api/slack/callback
 * Slack OAuth callback — exchanges code for access token.
 */
export async function slackCallback(req: Request, res: Response): Promise<void> {
  const { code, state: userId, error } = req.query;

  if (error) {
    res.redirect(`${config.frontendUrl}/dashboard?slack_error=${error}`);
    return;
  }

  if (!code || !userId) {
    res.redirect(`${config.frontendUrl}/dashboard?slack_error=missing_params`);
    return;
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      null,
      {
        params: {
          client_id: config.slack.clientId,
          client_secret: config.slack.clientSecret,
          code,
          redirect_uri: config.slack.redirectUri,
        },
      }
    );

    const tokenData = tokenResponse.data;

    if (!tokenData.ok) {
      console.error('[Slack] OAuth error:', tokenData.error);
      res.redirect(`${config.frontendUrl}/dashboard?slack_error=${tokenData.error}`);
      return;
    }

    const accessToken = tokenData.access_token;
    const teamId = tokenData.team?.id;
    const slackUserId = tokenData.authed_user?.id;

    // Store token in DB
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.update(userId as string, {
      slackAccessToken: accessToken,
      slackTeamId: teamId,
      slackUserId: slackUserId,
    });

    console.log('[Slack] Connected for user:', userId);
    res.redirect(`${config.frontendUrl}/dashboard?slack_connected=true`);
  } catch (err) {
    console.error('[Slack] Callback error:', err);
    res.redirect(`${config.frontendUrl}/dashboard?slack_error=server_error`);
  }
}

/**
 * DELETE /api/slack/disconnect
 * Removes Slack token for the current user.
 */
export async function disconnectSlack(req: Request, res: Response): Promise<void> {
  const userId = (req.user as { id: string })?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);
  await userRepo.update(userId, {
    slackAccessToken: null,
    slackTeamId: null,
    slackUserId: null,
  });

  res.json({ success: true, message: 'Slack disconnected' });
}

/**
 * GET /api/slack/status
 * Returns whether the current user has Slack connected.
 */
export async function getSlackStatus(req: Request, res: Response): Promise<void> {
  const userId = (req.user as { id: string })?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    res.json({
      connected: !!user?.slackAccessToken,
      teamId: user?.slackTeamId || null,
    });
  } catch {
    // Dev bypass user may not be in DB yet — that's fine
    res.json({ connected: false, teamId: null });
  }
}
