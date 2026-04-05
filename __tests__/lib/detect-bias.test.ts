import { detectBias } from '@/lib/openai/detect-bias';

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
                    flags: [],
                    bias_free: true,
                    overall_assessment: 'No bias detected in this review.',
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

describe('detectBias', () => {
  it('returns bias_free true for neutral review text', async () => {
    const result = await detectBias({
      reviewText: 'John consistently delivers high-quality work and collaborates well with the team.',
      revieweeName: 'John',
      reviewerName: 'Manager',
    });
    expect(result.bias_free).toBe(true);
    expect(result.flags).toEqual([]);
    expect(result.overall_assessment).toBeTruthy();
  });

  it('returns the correct shape with flags array', async () => {
    const result = await detectBias({
      reviewText: 'She is very emotional and tends to be bossy.',
      revieweeName: 'Jane',
      reviewerName: 'Manager',
    });
    expect(typeof result.bias_free).toBe('boolean');
    expect(Array.isArray(result.flags)).toBe(true);
  });
});