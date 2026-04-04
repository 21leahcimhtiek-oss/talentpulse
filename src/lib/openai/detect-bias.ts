import OpenAI from 'openai';
import * as Sentry from '@sentry/nextjs';
import type { BiasAnalysis } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
  throw lastError;
}

export async function detectBias(reviewText: string): Promise<BiasAnalysis> {
  const fallback: BiasAnalysis = {
    hasBias: false,
    biasTypes: [],
    confidence: 0,
    explanation: 'Bias analysis temporarily unavailable.',
    suggestedRevision: null,
  };

  if (!reviewText || reviewText.trim().length < 20) return fallback;

  try {
    return await withRetry(async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert HR consultant specializing in identifying unconscious bias in performance reviews. Analyze the provided text for:
- Gender bias (gendered language, stereotyping)
- Racial/ethnic bias
- Age bias (ageist assumptions)
- Affinity bias (favoring similar people)
- Halo/horn effect (one trait influencing overall evaluation)
- Attribution bias (attributing success/failure incorrectly)
- Recency bias (over-weighting recent events)

Return ONLY valid JSON with this exact structure:
{
  "hasBias": boolean,
  "biasTypes": string[],
  "confidence": number (0-1),
  "explanation": string,
  "suggestedRevision": string | null
}`,
          },
          {
            role: 'user',
            content: `Analyze this performance review for bias:\n\n${reviewText}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 600,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content) as Partial<BiasAnalysis>;
      return {
        hasBias: parsed.hasBias ?? false,
        biasTypes: Array.isArray(parsed.biasTypes) ? parsed.biasTypes : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        explanation: parsed.explanation ?? '',
        suggestedRevision: parsed.suggestedRevision ?? null,
      };
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { service: 'openai', function: 'detectBias' },
      extra: { textLength: reviewText.length },
    });
    return fallback;
  }
}