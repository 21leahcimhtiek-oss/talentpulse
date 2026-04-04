import OpenAI from 'openai';
import * as Sentry from '@sentry/nextjs';
import type { SentimentResult } from '@/types';

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

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const fallback: SentimentResult = {
    score: 0,
    label: 'neutral',
    confidence: 0,
  };

  if (!text || text.trim().length < 5) return fallback;

  try {
    return await withRetry(async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis expert. Analyze the sentiment of the provided feedback text.

Return ONLY valid JSON:
{
  "score": number (-1.0 to 1.0, where -1 is very negative, 0 is neutral, 1 is very positive),
  "label": "positive" | "neutral" | "negative",
  "confidence": number (0-1)
}`,
          },
          {
            role: 'user',
            content: `Analyze sentiment:\n\n${text}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content) as Partial<SentimentResult>;
      const score = typeof parsed.score === 'number'
        ? Math.max(-1, Math.min(1, parsed.score))
        : 0;

      const label: SentimentResult['label'] =
        parsed.label === 'positive' || parsed.label === 'negative'
          ? parsed.label
          : 'neutral';

      return {
        score,
        label,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      };
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { service: 'openai', function: 'analyzeSentiment' },
      extra: { textLength: text.length },
    });
    return fallback;
  }
}