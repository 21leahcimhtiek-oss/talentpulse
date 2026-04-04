import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface SentimentResult {
  score: number;
  label: SentimentLabel;
  confidence: number;
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const prompt = `Analyze the sentiment of this workplace feedback text.

Text: """${text}"""

Return JSON: { score: number (-1.0 to 1.0), label: "positive"|"neutral"|"negative", confidence: number (0.0 to 1.0) }
Return ONLY valid JSON, no markdown.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 100,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content ?? '{"score":0,"label":"neutral","confidence":0.5}';
  const parsed = JSON.parse(raw) as SentimentResult;
  const VALID_LABELS: SentimentLabel[] = ['positive', 'neutral', 'negative'];

  return {
    score: Math.max(-1, Math.min(1, parsed.score ?? 0)),
    label: VALID_LABELS.includes(parsed.label) ? parsed.label : 'neutral',
    confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
  };
}