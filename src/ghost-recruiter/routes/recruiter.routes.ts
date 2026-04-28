import { Router } from 'express';
import multer from 'multer';
import { RecruiterController } from '../controllers/recruiter.controller';
import { validateEvaluationRequestMiddleware } from '../middleware/validation.middleware';
import { errorHandlerMiddleware } from '../middleware/error-handler.middleware';

const router = Router();

/**
 * Multer upload configuration for PDF files
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req: any, file: any, cb: any) => {
    // Allowing all files to avoid mimetype mismatches during demo
    cb(null, true);
  }
});

/**
 * POST /api/ghost-recruiter/analyze
 * Evaluate CV (text) against job description
 */
router.post(
  '/analyze',
  validateEvaluationRequestMiddleware,
  RecruiterController.analyzeCVController
);

/**
 * POST /api/ghost-recruiter/analyze-file
 * Evaluate CV (PDF upload) against job description
 */
router.post(
  '/analyze-file',
  upload.single('cv'),
  RecruiterController.analyzeCVFileController
);

/**
 * GET /api/ghost-recruiter/health
 * Health check
 */
router.get('/health', RecruiterController.healthCheck);

// Error handling middleware
router.use(errorHandlerMiddleware);

export const ghostRecruiterRouter = router;
