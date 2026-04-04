import OpenAI from 'openai';
import type { OKR, PerformanceReview, PeerFeedback } from '@/types';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCoachingSuggestions(params: {
  employeeName: string;
  managerName: string;
  recentOKRs: OKR[];
  recentReviews: PerformanceReview[];
  recentFeedback: PeerFeedback[];
}): Promise<{ suggestions: string[]; context_summary: string }> {
  const { employeeName, managerName, recentOKRs, recentReviews, recentFeedback } = params;

  const okrSummary = recentOKRs.map(o => `- ${o.title}: ${o.progress}% (${o.status})`).join('\n') || 'No OKR data.';
  const reviewSummary = recentReviews.map(r => `- Score: ${r.overall_score}/5. Strengths: ${r.strengths}. Improve: ${r.improvements}`).join('\n') || 'No review data.';
  const feedbackSummary = recentFeedback.map(f => `- ${f.sentiment_label ?? 'unknown'}: "${f.content.slice(0, 100)}..."`).join('\n') || 'No feedback data.';

  const prompt = `You are an executive coach helping manager "${managerName}" develop their report "${employeeName}".

OKR Progress:
${okrSummary}

Performance Reviews:
${reviewSummary}

Peer Feedback (30 days):
${feedbackSummary}

Generate 3-5 specific, actionable coaching suggestions for the next 1:1. Each should be data-grounded, development-focused, and framed as a conversation starter.

Return JSON: { suggestions: string[], context_summary: string }
Return ONLY valid JSON, no markdown.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content ?? '{"suggestions":[],"context_summary":""}';
  const parsed = JSON.parse(raw) as { suggestions: string[]; context_summary: string };
  return { suggestions: parsed.suggestions ?? [], context_summary: parsed.context_summary ?? '' };
}