import { Request, Response, NextFunction } from 'express';
import { EvaluatorService } from '../services/evaluator.service';
import { extractTextFromPDF, truncateCVIfNeeded } from '../utils/pdf-extractor';
import { validateEvaluationRequest } from '../utils/validators';
import { formatErrorResponse } from '../utils/formatters';
import { HTTP_STATUS } from '../config/constants';

export class RecruiterController {
  /**
   * POST /api/ghost-recruiter/analyze
   * Analyze CV (text) against job description
   */
  static async analyzeCVController(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { cv_text, job_description, role_title, company_name, candidate_name } = req.body;

      const result = await EvaluatorService.evaluate({
        cv_text,
        job_description,
        role_title,
        company_name,
        candidate_name
      });

      res.status(result.statusCode).json(result.response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ghost-recruiter/analyze-file
   * Analyze CV (PDF upload) against job description
   */
  static async analyzeCVFileController(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const file = (req as any).file;
      const { job_description, role_title, company_name, candidate_name } = req.body;

      if (!file) {
        res.status(HTTP_STATUS.BAD_REQUEST).json(
          formatErrorResponse('INVALID_INPUT', 'CV PDF file is required', HTTP_STATUS.BAD_REQUEST)
        );
        return;
      }

      // Extract text from PDF
      let cv_text = await extractTextFromPDF(file.buffer);
      cv_text = truncateCVIfNeeded(cv_text);

      // Validate extracted text
      const validationErrors = validateEvaluationRequest({
        cv_text,
        job_description,
        role_title,
        company_name,
        candidate_name
      });

      if (validationErrors.length > 0) {
        const firstError = validationErrors[0];
        res.status(HTTP_STATUS.BAD_REQUEST).json(
          formatErrorResponse(
            'INVALID_INPUT',
            firstError.message,
            HTTP_STATUS.BAD_REQUEST,
            { field: firstError.field, constraint: firstError.constraint }
          )
        );
        return;
      }

      const result = await EvaluatorService.evaluate({
        cv_text,
        job_description,
        role_title,
        company_name,
        candidate_name
      });

      res.status(result.statusCode).json(result.response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ghost-recruiter/health
   * Health check endpoint
   */
  static healthCheck(req: Request, res: Response): void {
    res.json({
      status: 'ok',
      module: 'ghost-recruiter',
      timestamp: new Date().toISOString()
    });
  }
}
