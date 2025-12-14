import { Router } from 'express';
import * as progressController from './progress.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// All progress routes are protected
router.use(authenticate);

// Get overall progress stats
router.get('/', progressController.getProgress);

// Get attempt history
router.get('/history', progressController.getHistory);

// Get next verse to practice
router.get('/next-verse', progressController.getNextVerse);

// Get progress for a specific verse
router.get('/verses/:verseId', progressController.getVerseHistory);

// Get progress for a specific surah
router.get('/surahs/:surahId', progressController.getSurahProgress);

export { router as progressRouter };
