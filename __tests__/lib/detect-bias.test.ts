import { detectBias } from '@/lib/openai/detect-bias';
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

function makeOpenAIResponse(content: string) {
  return { choices: [{ message: { content } }] };
}

describe('detectBias', () => {
  it('returns fallback when text is too short (< 20 chars)', async () => {
    const result = await detectBias('too short');
    expect(result.hasBias).toBe(false);
    expect(result.biasTypes).toEqual([]);
    expect(result.confidence).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns fallback when OpenAI throws an error and captures to Sentry', async () => {
    const error = new Error('OpenAI API error');
    mockCreate.mockRejectedValueOnce(error);

    const result = await detectBias('This is a long enough text to trigger the OpenAI call path');
    expect(result.hasBias).toBe(false);
    expect(result.confidence).toBe(0);
    expect(mockSentryCapture).toHaveBeenCalledWith(error);
  });

  it('parses successful OpenAI response correctly', async () => {
    const responseContent = JSON.stringify({
      hasBias: false, biasTypes: [], confidence: 0.95,
      explanation: 'No bias detected in the text', suggestedRevision: null,
    });
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse(responseContent));

    const result = await detectBias('This is a sufficiently long text for bias detection analysis');
    expect(result.hasBias).toBe(false);
    expect(result.confidence).toBe(0.95);
    expect(result.explanation).toBe('No bias detected in the text');
  });

  it('returns hasBias true when bias types are found', async () => {
    const responseContent = JSON.stringify({
      hasBias: true, biasTypes: ['gender', 'age'], confidence: 0.88,
      explanation: 'Gender and age bias detected',
      suggestedRevision: 'Rephrase using neutral language',
    });
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse(responseContent));

    const result = await detectBias('She is too emotional and too old to handle the pressure well');
    expect(result.hasBias).toBe(true);
    expect(result.biasTypes).toContain('gender');
    expect(result.biasTypes).toContain('age');
    expect(result.suggestedRevision).toBe('Rephrase using neutral language');
  });

  it('retries on failure and succeeds on third attempt', async () => {
    const successResponse = makeOpenAIResponse(JSON.stringify({
      hasBias: false, biasTypes: [], confidence: 0.9,
      explanation: 'Clean text', suggestedRevision: null,
    }));
    mockCreate
      .mockRejectedValueOnce(new Error('Transient error 1'))
      .mockRejectedValueOnce(new Error('Transient error 2'))
      .mockResolvedValueOnce(successResponse);

    const result = await detectBias('This is a sufficiently long text for bias detection analysis retry test');
    expect(result.hasBias).toBe(false);
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });

  it('handles malformed JSON response from OpenAI gracefully', async () => {
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse('not valid json {{{'));

    const result = await detectBias('This is a sufficiently long text for bias detection analysis malformed');
    expect(result.hasBias).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it('sets confidence to 0 if missing from response', async () => {
    const responseContent = JSON.stringify({
      hasBias: false, biasTypes: [],
      explanation: 'No issues found', suggestedRevision: null,
    });
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse(responseContent));

    const result = await detectBias('This is a sufficiently long text for bias detection analysis confidence');
    expect(result.confidence).toBe(0);
  });

  it('returns null suggestedRevision when not present in response', async () => {
    const responseContent = JSON.stringify({
      hasBias: false, biasTypes: [], confidence: 0.7, explanation: 'Looks fine',
    });
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse(responseContent));

    const result = await detectBias('This is a sufficiently long text for bias detection with no suggestion');
    expect(result.suggestedRevision).toBeNull();
  });
});