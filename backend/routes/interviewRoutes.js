import express from 'express';
import {
  startSession,
  submitAnswer,
  getSessionHistory,
  getSessionById
} from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/start', protect, startSession);
router.post('/submit', protect, submitAnswer);
router.get('/history', protect, getSessionHistory);
router.get('/:sessionId', protect, getSessionById);

export default router;
