import express from 'express';
import { chat, getRecommendations } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/chat', protect, chat);
router.get('/recommendations', protect, getRecommendations);

export default router;
