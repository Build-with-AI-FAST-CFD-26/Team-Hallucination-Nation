import { AIProviderResponse } from '../types/response.types';

/**
 * Extract JSON from AI response, removing markdown and extra text
 */
export function extractJSONFromResponse(text: string): string {
  // Remove leading/trailing whitespace
  text = text.trim();

  // If wrapped in markdown code block, extract
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (markdownMatch) {
    text = markdownMatch[1].trim();
  }

  // Remove common prefixes and suffixes
  text = text.replace(/^[^{]*/, '');
  text = text.replace(/[^}]*$/, '');

  return text;
}

/**
 * Aggressively repair common JSON syntax errors
 * - Trailing commas
 * - Single quotes
 * - Unquoted keys
 */
export function aggressiveJSONRepair(rawText: string): string {
  let cleaned = rawText;
  // Fix trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  // Fix single quotes to double quotes
  cleaned = cleaned.replace(/'/g, '"');
  // Fix unquoted object keys
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
  return cleaned;
}

/**
 * Safely parse AI response JSON with fallback
 */
export function parseAIResponse(rawText: string): {
  success: boolean;
  data?: AIProviderResponse;
  error?: string;
} {
  try {
    // Clean up markdown and extra text
    const cleanedText = extractJSONFromResponse(rawText);

    // Attempt parse
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      // Try aggressive repair
      const repaired = aggressiveJSONRepair(cleanedText);
      parsed = JSON.parse(repaired);
    }

    // Validate required fields
    const required = [
      'decision',
      'score',
      'reason',
      'weak_lines',
      'improved_lines',
      'top_strengths',
      'interview_questions',
      'one_line_verdict'
    ];

    for (const field of required) {
      if (!(field in parsed)) {
        return {
          success: false,
          error: `Missing required field: ${field}`
        };
      }
    }

    // Validate decision
    if (!['Shortlist', 'Maybe', 'Reject'].includes(parsed.decision)) {
      return {
        success: false,
        error: `Invalid decision: ${parsed.decision}. Must be Shortlist, Maybe, or Reject`
      };
    }

    // Validate score
    if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) {
      return {
        success: false,
        error: `Invalid score: ${parsed.score}. Must be number 0-100`
      };
    }

    // Validate arrays
    if (!Array.isArray(parsed.weak_lines)) {
      parsed.weak_lines = [];
    }
    if (!Array.isArray(parsed.improved_lines)) {
      parsed.improved_lines = [];
    }
    if (!Array.isArray(parsed.top_strengths)) {
      parsed.top_strengths = [];
    }
    if (!Array.isArray(parsed.interview_questions)) {
      parsed.interview_questions = [];
    }

    return {
      success: true,
      data: parsed as AIProviderResponse
    };
  } catch (error) {
    return {
      success: false,
      error: `JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Sanitize strings in response
 */
export function sanitizeResponseStrings(response: AIProviderResponse): AIProviderResponse {
  return {
    ...response,
    reason: response.reason?.slice(0, 300) || '',
    weak_lines: (response.weak_lines || []).map(s => s?.slice(0, 150) || '').filter(s => s),
    improved_lines: (response.improved_lines || []).map(s => s?.slice(0, 150) || '').filter(s => s),
    top_strengths: (response.top_strengths || []).map(s => s?.slice(0, 150) || '').filter(s => s),
    interview_questions: (response.interview_questions || [])
      .map(s => s?.slice(0, 200) || '')
      .filter(s => s),
    one_line_verdict: response.one_line_verdict?.slice(0, 200) || ''
  };
}
