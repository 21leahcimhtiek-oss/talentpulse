import OpenAI from 'openai';
import * as Sentry from '@sentry/nextjs';
import type { Employee, Review, Feedback360, OKR } from '@/types';

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

interface CoachingContext {
  employee: Employee;
  reviews: Review[];
  feedback: Feedback360[];
  okrs: OKR[];
}

export async function generateCoaching(ctx: CoachingContext): Promise<string> {
  const fallback = `## Coaching Suggestions for ${ctx.employee.name}

*AI coaching generation is temporarily unavailable. Please review the employee's recent performance data manually and schedule a 1:1 to discuss goals and development opportunities.*

### Suggested Discussion Points
- Review progress on current OKRs
- Discuss recent feedback themes
- Identify skill development opportunities
- Align on priorities for the next quarter`;

  const { employee, reviews, feedback, okrs } = ctx;

  const avgScore =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.score, 0) / reviews.length).toFixed(1)
      : 'N/A';

  const atRiskOkrs = okrs.filter(
    (o) => o.status === 'at_risk' || o.status === 'missed'
  );

  const sentimentAvg =
    feedback.length > 0
      ? (feedback.reduce((s, f) => s + f.sentiment, 0) / feedback.length).toFixed(2)
      : 'N/A';

  const recentStrengths = reviews
    .slice(-3)
    .map((r) => r.strengths)
    .filter(Boolean)
    .join('; ');

  const recentImprovements = reviews
    .slice(-3)
    .map((r) => r.improvements)
    .filter(Boolean)
    .join('; ');

  const feedbackSamples = feedback
    .slice(-5)
    .map((f) => f.content)
    .join('\n- ');

  try {
    return await withRetry(async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert executive coach and HR consultant. Generate practical, actionable weekly coaching suggestions for a manager to use in their 1:1 with a direct report. Be specific, empathetic, and data-driven. Format as Markdown with clear sections.`,
          },
          {
            role: 'user',
            content: `Generate coaching suggestions for this employee:

**Employee:** ${employee.name}
**Department:** ${employee.department}
**Average Review Score:** ${avgScore}/5
**Feedback Sentiment Average:** ${sentimentAvg} (-1 to 1 scale)
**At-Risk/Missed OKRs:** ${atRiskOkrs.length} (${atRiskOkrs.map((o) => o.title).join(', ') || 'none'})

**Recent Strengths (from reviews):** ${recentStrengths || 'No data'}
**Areas for Improvement (from reviews):** ${recentImprovements || 'No data'}

**Recent 360 Feedback:**
- ${feedbackSamples || 'No peer feedback available'}

Provide:
1. A brief performance summary (2-3 sentences)
2. Top 3 strengths to acknowledge and build on
3. Top 2-3 development areas with specific action steps
4. Recommended conversation starters for the 1:1
5. 30/60/90 day focus suggestions
6. Resources or learning recommendations`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');
      return content;
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { service: 'openai', function: 'generateCoaching' },
      extra: { employeeId: employee.id },
    });
    return fallback;
  }
}