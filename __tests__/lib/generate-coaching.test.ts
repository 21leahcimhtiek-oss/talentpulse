import { generateCoaching } from '@/lib/openai/generate-coaching';
import type { Employee, Review, Feedback360, OKR } from '@/types';
import OpenAI from 'openai';
import * as Sentry from '@sentry/nextjs';

jest.mock('openai');
jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }));

const mockSentryCapture = Sentry.captureException as jest.MockedFunction<typeof Sentry.captureException>;
const MockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
const mockCreate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  MockOpenAI.mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  } as any));
});

const baseEmployee: Employee = {
  id: 'emp-1',
  name: 'Jordan Smith',
  department: 'Engineering',
  role: 'engineer',
  start_date: '2022-03-01',
  manager_id: 'mgr-1',
  created_at: '2022-03-01T00:00:00Z',
};

const makeReview = (score: number, overrides: Partial<Review> = {}): Review => ({
  id: `rev-${score}`,
  employee_id: 'emp-1',
  reviewer_id: 'user-1',
  score,
  strengths: 'Technically strong and collaborative',
  improvements: 'Needs to improve documentation',
  period: '2024-Q1',
  ai_bias_flag: false,
  created_at: '2024-04-01T00:00:00Z',
  ...overrides,
});

const makeFeedback = (overrides: Partial<Feedback360> = {}): Feedback360 => ({
  id: 'fb-1',
  employee_id: 'emp-1',
  reviewer_id: 'peer-1',
  relationship: 'peer',
  rating: 4,
  comments: 'Great to work with',
  created_at: '2024-04-01T00:00:00Z',
  ...overrides,
});

const makeOKR = (status: string, overrides: Partial<OKR> = {}): OKR => ({
  id: `okr-${status}`,
  employee_id: 'emp-1',
  title: `Q1 OKR - ${status}`,
  description: 'Deliver feature X',
  status,
  progress: status === 'at_risk' ? 20 : 80,
  due_date: '2024-06-30',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

function makeOpenAIResponse(content: string) {
  return { choices: [{ message: { content } }] };
}

describe('generateCoaching', () => {
  it('returns markdown string on success', async () => {
    const markdown = '## Coaching Plan\n\n**Strengths:** Good communicator\n\n**Areas to Improve:** Time management';
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse(markdown));

    const result = await generateCoaching(baseEmployee, [makeReview(4)], [makeFeedback()], [makeOKR('on_track')]);
    expect(typeof result).toBe('string');
    expect(result).toContain('##');
  });

  it('returns fallback message when OpenAI throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('OpenAI rate limit'));

    const result = await generateCoaching(baseEmployee, [makeReview(4)], [makeFeedback()], [makeOKR('on_track')]);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(mockSentryCapture).toHaveBeenCalled();
  });

  it('includes employee name in the prompt sent to OpenAI', async () => {
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse('## Plan'));

    await generateCoaching(baseEmployee, [makeReview(4)], [makeFeedback()], [makeOKR('on_track')]);

    const callArgs = mockCreate.mock.calls[0][0];
    const promptText = JSON.stringify(callArgs);
    expect(promptText).toContain('Jordan Smith');
  });

  it('handles empty reviews array without throwing', async () => {
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse('## Coaching Plan with no reviews'));

    const result = await generateCoaching(baseEmployee, [], [makeFeedback()], [makeOKR('on_track')]);
    expect(result).toBeTruthy();
  });

  it('handles empty feedback array without throwing', async () => {
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse('## Coaching Plan with no feedback'));

    const result = await generateCoaching(baseEmployee, [makeReview(3)], [], [makeOKR('on_track')]);
    expect(result).toBeTruthy();
  });

  it('calculates average score correctly from multiple reviews', async () => {
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse('## Plan'));

    const reviews = [makeReview(2), makeReview(4), makeReview(3)];
    await generateCoaching(baseEmployee, reviews, [], []);

    const callArgs = mockCreate.mock.calls[0][0];
    const promptText = JSON.stringify(callArgs);
    expect(promptText).toContain('3');
  });

  it('identifies at-risk OKRs and includes them in prompt context', async () => {
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse('## Plan'));

    const okrs = [makeOKR('on_track'), makeOKR('at_risk'), makeOKR('at_risk', { title: 'Critical Q2 Goal' })];
    await generateCoaching(baseEmployee, [makeReview(4)], [], okrs);

    const callArgs = mockCreate.mock.calls[0][0];
    const promptText = JSON.stringify(callArgs);
    expect(promptText).toMatch(/at.?risk/i);
  });

  it('retries on transient failure and succeeds', async () => {
    mockCreate
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce(makeOpenAIResponse('## Coaching Plan'));

    const result = await generateCoaching(baseEmployee, [makeReview(4)], [makeFeedback()], [makeOKR('on_track')]);
    expect(result).toContain('##');
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });
});