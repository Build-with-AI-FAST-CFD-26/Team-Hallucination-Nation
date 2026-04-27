import { Router } from 'express';
import { RecruiterController } from '../controllers/recruiter.controller';
import { validateEvaluationRequestMiddleware } from '../middleware/validation.middleware';
import { errorHandlerMiddleware } from '../middleware/error-handler.middleware';

const router = Router();

/**
 * POST /api/ghost-recruiter/analyze
 * Evaluate CV against job description
 */
router.post(
  '/analyze',
  validateEvaluationRequestMiddleware,
  RecruiterController.analyzeCVController
);

/**
 * GET /api/ghost-recruiter/health
 * Health check
 */
router.get('/health', RecruiterController.healthCheck);

// Error handling middleware
router.use(errorHandlerMiddleware);

export const ghostRecruiterRouter = router;
