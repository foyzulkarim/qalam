import { Router } from 'express';
import * as evaluateController from './evaluate.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Evaluate a verse attempt (protected)
router.post('/', authenticate, evaluateController.evaluate);

export { router as evaluateRouter };
