import { Request, Response, NextFunction } from 'express';
import * as evaluateService from './evaluate.service.js';
import { validateVerseId, validateUserInput, validateBoolean } from '../../middleware/validation.js';
import type { EvaluateRequest, EvaluateResponse } from '@qalam/shared';

export async function evaluate(
  req: Request<object, EvaluateResponse, EvaluateRequest>,
  res: Response<EvaluateResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const verseId = validateVerseId(req.body.verseId);
    const userInput = validateUserInput(req.body.userInput);
    const skipped = validateBoolean(req.body.skipped, 'skipped');

    const result = await evaluateService.evaluateVerse({
      userId: req.user!.id,
      verseId,
      userInput,
      skipped,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
