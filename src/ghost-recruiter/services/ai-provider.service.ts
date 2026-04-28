import { EVALUATION_PROMPT, SYSTEM_PROMPT } from '../config/prompts';
import { AI_CONFIG, HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { parseAIResponse, sanitizeResponseStrings } from '../utils/parsers';
import { AIProviderResponse, AIProviderError } from '../types/response.types';

interface GoogleGenerativeAIResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export class AIProviderService {
  private static apiKey = AI_CONFIG.API_KEY;
  private static model = AI_CONFIG.MODEL;
  private static timeout = AI_CONFIG.TIMEOUT_MS;
  private static maxRetries = AI_CONFIG.MAX_RETRIES;

  /**
   * Health check for AI provider availability
   */
  static async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    if (!this.apiKey) {
      return { healthy: false, latencyMs: 0 };
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
        { method: 'GET', signal: controller.signal }
      );

      clearTimeout(timeoutId);
      return { healthy: response.ok, latencyMs: Date.now() - start };
    } catch {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }

  /**
   * Call Gemini API to evaluate CV
   */
  static async evaluateCV(
    cvText: string,
    jobDescription: string,
    roleTitle?: string
  ): Promise<{
    success: boolean;
    data?: AIProviderResponse;
    error?: AIProviderError;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();

    if (!this.apiKey) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: 'AI provider not configured',
          status: 'MISSING_CONFIG',
          retryable: false
        },
        processingTimeMs: Date.now() - startTime
      };
    }

    // Build prompt
    const userPrompt = EVALUATION_PROMPT(cvText, jobDescription, roleTitle);

    // Retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.callGeminiAPI(userPrompt);
        const processingTimeMs = Date.now() - startTime;

        if (response.success && response.data) {
          return {
            success: true,
            data: response.data,
            processingTimeMs
          };
        } else if (response.error && !response.error.retryable) {
          return {
            success: false,
            error: response.error,
            processingTimeMs
          };
        }

        // Retryable error, continue loop
        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === this.maxRetries) {
          return {
            success: false,
            error: {
              code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
              message: 'AI service unreachable after retries',
              status: 'UNAVAILABLE',
              retryable: true
            },
            processingTimeMs: Date.now() - startTime
          };
        }
        await this.delay(Math.pow(2, attempt - 1) * 1000);
      }
    }

    return {
      success: false,
      error: {
        code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
        message: 'Max retries exceeded',
        status: 'MAX_RETRIES',
        retryable: true
      },
      processingTimeMs: Date.now() - startTime
    };
  }

  /**
   * Call Gemini API endpoint
   */
  private static async callGeminiAPI(prompt: string): Promise<{
    success: boolean;
    data?: AIProviderResponse;
    error?: AIProviderError;
  }> {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\n${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${url}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          return {
            success: false,
            error: {
              code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
              message: 'Rate limit exceeded',
              status: 'RATE_LIMITED',
              retryable: true
            }
          };
        }

        if (response.status >= 500) {
          return {
            success: false,
            error: {
              code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
              message: 'AI service temporarily unavailable',
              status: 'SERVICE_ERROR',
              retryable: true
            }
          };
        }

        return {
          success: false,
          error: {
            code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
            message: (errorData as any).error?.message || 'AI service error',
            status: 'API_ERROR',
            retryable: false
          }
        };
      }

      const data: GoogleGenerativeAIResponse = await response.json();

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_JSON_RESPONSE,
            message: 'Invalid AI response format',
            status: 'INVALID_FORMAT',
            retryable: true
          }
        };
      }

      const rawText = data.candidates[0].content.parts[0].text;
      const parseResult = parseAIResponse(rawText);

      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_JSON_RESPONSE,
            message: parseResult.error || 'Failed to parse AI response',
            status: 'PARSE_ERROR',
            retryable: true
          }
        };
      }

      // Sanitize response
      const sanitized = sanitizeResponseStrings(parseResult.data!);

      return {
        success: true,
        data: sanitized
      };
    } catch (error: any) {
      console.error('Gemini API call error:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
            message: 'AI request timeout',
            status: 'TIMEOUT',
            retryable: true
          }
        };
      }

      return {
        success: false,
        error: {
          code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
          message: error.message || 'Unknown error',
          status: 'UNKNOWN',
          retryable: true
        }
      };
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
