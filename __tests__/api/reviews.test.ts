import { GET, POST } from '@/app/api/reviews/route';
import { NextRequest } from 'next/server';

const mockUser = { id: 'reviewer-1' };
const mockReviews = [
  {
    id: 'rev-1',
    reviewer_id: 'reviewer-1',
    reviewee_id: 'employee-1',
    cycle: 'Q4 2024',
    overall_score: 4,
    submitted_at: new Date().toISOString(),
  },
];

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockReviews, error: null }),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockReviews[0], error: null }),
    })),
  })),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/openai/detect-bias', () => ({
  detectBias: jest.fn().mockResolvedValue({
    flags: [],
    bias_free: true,
    overall_assessment: 'No bias detected.',
  }),
}));

describe('GET /api/reviews', () => {
  it('returns reviews for authenticated user', async () => {
    const req = new NextRequest('http://localhost/api/reviews');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });
});

describe('POST /api/reviews', () => {
  it('creates a review and runs bias check', async () => {
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        reviewee_id: 'employee-1',
        cycle: 'Q4 2024',
        overall_score: 4,
        strengths: 'Great communicator and team player.',
        improvements: 'Could improve technical documentation.',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.bias).toBeDefined();
    expect(body.bias.bias_free).toBe(true);
  });
});