import { Request, Response, NextFunction } from 'express';
import { EvaluatorService } from '../services/evaluator.service';

export class RecruiterController {
  /**
   * POST /api/ghost-recruiter/analyze
   * Analyze CV against job description
   */
  static async analyzeCVController(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { cv_text, job_description, role_title, company_name, candidate_name } = req.body;

      // Evaluate
      const result = await EvaluatorService.evaluate({
        cv_text,
        job_description,
        role_title,
        company_name,
        candidate_name
      });

      res.status(result.statusCode).json(result.response);
    } catch (error) {
      // Pass to error handler middleware
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
