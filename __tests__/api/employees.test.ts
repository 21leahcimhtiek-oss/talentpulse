import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/employees/route';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import * as Sentry from '@sentry/nextjs';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 }),
}));

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function makeSupabaseMock(overrides: Record<string, unknown> = {}) {
  const chainable = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    ...overrides,
  };
  return chainable;
}

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('GET /api/employees', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as any);

    const req = makeRequest('GET', 'http://localhost:3000/api/employees');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it('returns employees list when authenticated', async () => {
    const employees = [
      { id: 'emp-1', name: 'Alice', department: 'Engineering', role: 'engineer' },
      { id: 'emp-2', name: 'Bob', department: 'Sales', role: 'sales' },
    ];
    const chain = makeSupabaseMock();
    chain.order.mockResolvedValueOnce({ data: employees, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn().mockReturnValue(chain),
    } as any);

    const req = makeRequest('GET', 'http://localhost:3000/api/employees');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.employees).toHaveLength(2);
    expect(json.employees[0].name).toBe('Alice');
  });

  it('supports department filter query param', async () => {
    const employees = [{ id: 'emp-1', name: 'Alice', department: 'Engineering', role: 'engineer' }];
    const chain = makeSupabaseMock();
    chain.order.mockResolvedValueOnce({ data: employees, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn().mockReturnValue(chain),
    } as any);

    const req = makeRequest('GET', 'http://localhost:3000/api/employees?department=Engineering');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(chain.eq).toHaveBeenCalledWith('department', 'Engineering');
  });

  it('supports search query param', async () => {
    const employees = [{ id: 'emp-1', name: 'Alice', department: 'Engineering', role: 'engineer' }];
    const chain = makeSupabaseMock();
    chain.order.mockResolvedValueOnce({ data: employees, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn().mockReturnValue(chain),
    } as any);

    const req = makeRequest('GET', 'http://localhost:3000/api/employees?search=Alice');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(chain.ilike).toHaveBeenCalledWith('name', '%Alice%');
  });
});

describe('POST /api/employees', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/employees', { name: 'Carol' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user role is employee', async () => {
    const chain = makeSupabaseMock();
    chain.single.mockResolvedValueOnce({ data: { role: 'employee' }, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn().mockReturnValue(chain),
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/employees', {
      name: 'Carol',
      department: 'Engineering',
      role: 'engineer',
      start_date: '2024-01-01',
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/forbidden/i);
  });

  it('returns 400 with Zod validation errors when name is missing', async () => {
    const chain = makeSupabaseMock();
    chain.single.mockResolvedValueOnce({ data: { role: 'admin' }, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn().mockReturnValue(chain),
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/employees', {
      department: 'Engineering',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.errors).toBeDefined();
  });

  it('returns 400 with Zod validation errors for invalid manager_id', async () => {
    const chain = makeSupabaseMock();
    chain.single.mockResolvedValueOnce({ data: { role: 'admin' }, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn().mockReturnValue(chain),
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/employees', {
      name: 'Carol',
      department: 'Engineering',
      role: 'engineer',
      start_date: '2024-01-01',
      manager_id: 'not-a-uuid',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('creates employee and returns 201', async () => {
    const newEmployee = {
      id: 'emp-new',
      name: 'Carol',
      department: 'Engineering',
      role: 'engineer',
      start_date: '2024-01-01',
    };
    const profileChain = makeSupabaseMock();
    profileChain.single.mockResolvedValueOnce({ data: { role: 'admin' }, error: null });

    const insertChain = makeSupabaseMock();
    insertChain.single.mockResolvedValueOnce({ data: newEmployee, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn()
        .mockReturnValueOnce(profileChain)
        .mockReturnValueOnce(insertChain),
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/employees', {
      name: 'Carol',
      department: 'Engineering',
      role: 'engineer',
      start_date: '2024-01-01',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.employee.name).toBe('Carol');
  });

  it('returns 400 for invalid date format', async () => {
    const chain = makeSupabaseMock();
    chain.single.mockResolvedValueOnce({ data: { role: 'admin' }, error: null });

    mockCreateClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: jest.fn().mockReturnValue(chain),
    } as any);

    const req = makeRequest('POST', 'http://localhost:3000/api/employees', {
      name: 'Carol',
      department: 'Engineering',
      role: 'engineer',
      start_date: 'not-a-date',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});