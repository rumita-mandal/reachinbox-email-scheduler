import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import {
  scheduleEmails,
  getScheduledEmails,
  getSentEmails,
  searchEmails,
  getEmailStats,
} from '../controllers/emailController';

const router = Router();

// Multer config: store CSV in memory (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'text/plain' ||
      file.originalname.endsWith('.csv') ||
      file.originalname.endsWith('.txt')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV/TXT files are allowed'));
    }
  },
});

router.use(requireAuth);

router.post('/schedule', upload.single('recipients'), scheduleEmails);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.get('/search', searchEmails);
router.get('/stats', getEmailStats);

export default router;
