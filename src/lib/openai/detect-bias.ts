import OpenAI from 'openai';
import { z } from 'zod';
import type { BiasFlag } from '@/types';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BiasAnalysisSchema = z.object({
  flags: z.array(z.object({
    type: z.string(),
    text: z.string(),
    suggestion: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
  })),
  overall_assessment: z.string(),
  bias_free: z.boolean(),
});

export async function detectBias(
  reviewText: string,
  reviewerName: string,
  revieweeName: string
): Promise<{ flags: BiasFlag[]; bias_free: boolean; overall_assessment: string }> {
  const prompt = `You are an expert HR analyst specializing in unconscious bias detection in performance reviews.

Analyze the following performance review written by "${reviewerName}" about "${revieweeName}" for bias.

Look for: gendered language, personality- vs accomplishment-focused language, vague feedback lacking examples, double standards, stereotype-based assumptions.

Review text:
"""
${reviewText}
"""

Return a JSON object with:
- flags: array with fields: type, text (the biased phrase), suggestion (neutral alternative), severity (low/medium/high)
- overall_assessment: brief summary
- bias_free: true only if no flags found

Return ONLY valid JSON, no markdown.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content ?? '{"flags":[],"overall_assessment":"","bias_free":true}';
  const parsed = BiasAnalysisSchema.parse(JSON.parse(raw));
  return parsed;
}