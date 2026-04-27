import { EvaluationRequest } from '../types/request.types';
import { EvaluationResponse } from '../types/response.types';
import { AIProviderService } from './ai-provider.service';
import { formatEvaluationResponse, formatErrorResponse } from '../utils/formatters';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

export class EvaluatorService {
  /**
   * Main evaluation entrypoint
   */
  static async evaluate(request: EvaluationRequest): Promise<{
    response: EvaluationResponse | any;
    statusCode: number;
  }> {
    const startTime = Date.now();

    try {
      // Call AI provider
      const aiResult = await AIProviderService.evaluateCV(
        request.cv_text,
        request.job_description,
        request.role_title
      );

      const processingTimeMs = Date.now() - startTime;

      if (!aiResult.success) {
        // AI provider error
        let statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;

        if (aiResult.error?.code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
          statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
        }

        return {
          response: formatErrorResponse(
            aiResult.error?.code || ERROR_CODES.AI_SERVICE_UNAVAILABLE,
            aiResult.error?.message || 'AI evaluation failed',
            statusCode
          ),
          statusCode
        };
      }

      // Format response
      const formattedResponse = formatEvaluationResponse(aiResult.data!, processingTimeMs);

      return {
        response: formattedResponse,
        statusCode: HTTP_STATUS.OK
      };
    } catch (error) {
      console.error('Evaluation service error:', error);

      return {
        response: formatErrorResponse(
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          'Internal server error during evaluation',
          HTTP_STATUS.INTERNAL_ERROR
        ),
        statusCode: HTTP_STATUS.INTERNAL_ERROR
      };
    }
  }
}
