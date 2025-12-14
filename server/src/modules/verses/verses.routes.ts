import { Router } from 'express';
import * as versesController from './verses.controller.js';

const router = Router();

// Get all surahs (metadata only)
router.get('/', versesController.getAllSurahs);

// Get a specific surah with all verses
router.get('/:id', versesController.getSurah);

// Get a specific verse
router.get('/:surahId/verses/:verseNumber', versesController.getVerse);

export { router as versesRouter };
