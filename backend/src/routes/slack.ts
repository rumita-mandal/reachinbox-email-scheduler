import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  connectSlack,
  slackCallback,
  disconnectSlack,
  getSlackStatus,
} from '../controllers/slackController';

const router = Router();

router.get('/connect', requireAuth, connectSlack);
router.get('/callback', slackCallback);
router.delete('/disconnect', requireAuth, disconnectSlack);
router.get('/status', requireAuth, getSlackStatus);

export default router;
