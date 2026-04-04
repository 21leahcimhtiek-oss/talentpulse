import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/reviews/route';
import { createClient } from '@/lib/supabase/server';
import { detectBias } from '@/lib/openai/detect-bias';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true }),
}));
jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }));
jest.mock('@/lib/openai/detect-bias', () => ({
  detectBias: jest.fn().mockResolvedValue({
    hasBias: false,
    biasTypes: [],
    confidence: 0.9,
    explanation: 'No bias detected',
    suggestedRevision: null,
  }),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockDetectBias = detectBias as jest.MockedFunction<typeof detectBias>;

function makeSupabaseMock(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn(),
    ...overrides,
  };
  return chain;
}

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('GET /api/reviews', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 for unauthenticated request', async () => {
    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as any);

    const req = makeRequest('GET', 'http://localhost:3000/api/reviews');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it('returns reviews for authenticated user', async () => {
    const reviews = [
      {
        id: 'rev-1',
        employee_id: 'emp-1',
        reviewer_id: 'user-1',
        score: 4,
        strengths: 'Great communicator',
        improvements: 'Could improve time management',
        period: '2024-Q1',
        ai_bias_flag: false,
      },
    ];
    const chain = makeSupabaseMock();
    chain.order.mockResolvedValueOnce({ data: reviews, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn().mockReturnValue(chain),
    } as any);

    const req = makeRequest('GET', 'http://localhost:3000/api/reviews');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reviews).toHaveLength(1);
    expect(json.reviews[0].score).toBe(4);
  });
});

describe('POST /api/reviews', () => {
  beforeEach(() => jest.clearAllMocks());

  const validPayload = {
    employee_id: 'emp-1',
    period: '2024-Q2',
    score: 4,
    strengths: 'Excellent team player and communicator',
    improvements: 'Should work on technical documentation skills',
  };

  it('creates review successfully and calls detectBias', async () => {
    const createdReview = { id: 'rev-new', ...validPayload, ai_bias_flag: false };
    const profileChain = makeSupabaseMock();
    profileChain.single.mockResolvedValueOnce({ data: { role: 'manager' }, error: null });
    const insertChain = makeSupabaseMock();
    insertChain.single.mockResolvedValueOnce({ data: createdReview, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn()
        .mockReturnValueOnce(profileChain)
        .mockReturnValueOnce(insertChain),
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/reviews', validPayload);
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockDetectBias).toHaveBeenCalledTimes(1);
  });

  it('sets ai_bias_flag true when bias detected', async () => {
    mockDetectBias.mockResolvedValueOnce({
      hasBias: true,
      biasTypes: ['gender'],
      confidence: 0.85,
      explanation: 'Gender bias detected',
      suggestedRevision: 'Rephrase to be neutral',
    });

    const createdReview = { id: 'rev-bias', ...validPayload, ai_bias_flag: true };
    const profileChain = makeSupabaseMock();
    profileChain.single.mockResolvedValueOnce({ data: { role: 'manager' }, error: null });
    const insertChain = makeSupabaseMock();
    insertChain.single.mockResolvedValueOnce({ data: createdReview, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn()
        .mockReturnValueOnce(profileChain)
        .mockReturnValueOnce(insertChain),
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/reviews', validPayload);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.review.ai_bias_flag).toBe(true);
  });

  it('validates score must be 1-5', async () => {
    const profileChain = makeSupabaseMock();
    profileChain.single.mockResolvedValueOnce({ data: { role: 'manager' }, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn().mockReturnValue(profileChain),
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/reviews', { ...validPayload, score: 6 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.errors).toBeDefined();
  });

  it('validates strengths and improvements are required', async () => {
    const profileChain = makeSupabaseMock();
    profileChain.single.mockResolvedValueOnce({ data: { role: 'manager' }, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn().mockReturnValue(profileChain),
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/reviews', {
      employee_id: 'emp-1',
      period: '2024-Q2',
      score: 3,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('calls detectBias with concatenated strengths and improvements text', async () => {
    const createdReview = { id: 'rev-new', ...validPayload, ai_bias_flag: false };
    const profileChain = makeSupabaseMock();
    profileChain.single.mockResolvedValueOnce({ data: { role: 'manager' }, error: null });
    const insertChain = makeSupabaseMock();
    insertChain.single.mockResolvedValueOnce({ data: createdReview, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn()
        .mockReturnValueOnce(profileChain)
        .mockReturnValueOnce(insertChain),
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/reviews', validPayload);
    await POST(req);

    const biasCallArg = mockDetectBias.mock.calls[0][0] as string;
    expect(biasCallArg).toContain(validPayload.strengths);
    expect(biasCallArg).toContain(validPayload.improvements);
  });

  it('handles OpenAI error gracefully and still creates review', async () => {
    mockDetectBias.mockRejectedValueOnce(new Error('OpenAI timeout'));

    const createdReview = { id: 'rev-new', ...validPayload, ai_bias_flag: false };
    const profileChain = makeSupabaseMock();
    profileChain.single.mockResolvedValueOnce({ data: { role: 'manager' }, error: null });
    const insertChain = makeSupabaseMock();
    insertChain.single.mockResolvedValueOnce({ data: createdReview, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn()
        .mockReturnValueOnce(profileChain)
        .mockReturnValueOnce(insertChain),
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/reviews', validPayload);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});