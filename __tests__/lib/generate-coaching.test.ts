import { generateCoaching } from '@/lib/openai/generate-coaching';

jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    suggestions: [
                      'Schedule weekly 1:1s to discuss OKR progress.',
                      'Pair with a senior engineer for code review practice.',
                      'Encourage participation in cross-functional projects.',
                    ],
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

describe('generateCoaching', () => {
  it('returns an array of coaching suggestions', async () => {
    const result = await generateCoaching({
      employeeName: 'Alice',
      recentReviews: [{ overall_score: 3, strengths: 'Good communicator', improvements: 'Needs more focus on delivery' } as never],
      okrs: [{ title: 'Improve code quality', progress: 45, status: 'at_risk' } as never],
      peerFeedback: [{ content: 'Helpful and collaborative', sentiment_label: 'positive' } as never],
    });
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
    result.suggestions.forEach((s: string) => expect(typeof s).toBe('string'));
  });
});