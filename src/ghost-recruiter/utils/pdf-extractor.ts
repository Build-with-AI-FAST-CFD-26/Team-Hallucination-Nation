import * as _pdf from "pdf-parse";
const pdf = (_pdf as any).default || _pdf;

/**
 * Extract text content from a PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Truncate CV text to avoid hitting AI token limits
 * Max ~3000 words is usually enough for a CV
 */
export function truncateCVIfNeeded(text: string, maxLength: number = 15000): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '... [TRUNCATED]';
}
