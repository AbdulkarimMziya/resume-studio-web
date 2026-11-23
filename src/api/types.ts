// Mirrors the DRF serializers on the backend.

/** AnalyzeRequestSerializer: resume_text (max 30,000), job_description (max 20,000). */
export interface AnalyzeRequest {
  resume_text: string;
  job_description: string;
}

/** SuggestionSerializer */
export interface Suggestion {
  original: string;
  replacement: string;
  reason: string;
}

/** AnalyzeResponseSerializer: 0–5 suggestions. An empty list means "nothing worth changing". */
export interface AnalyzeResponse {
  suggestions: Suggestion[];
}

export const MAX_RESUME_LENGTH = 30_000;
export const MAX_JOB_LENGTH = 20_000;
