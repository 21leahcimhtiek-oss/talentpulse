import { GET, POST } from '@/app/api/employees/route';
import { NextRequest } from 'next/server';

const mockUser = { id: 'user-123', email: 'test@test.com' };
const mockEmployees = [
  { id: 'emp-1', profile_id: 'user-123', job_title: 'Engineer', department: 'Engineering', status: 'active' },
];

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockEmployees, error: null, count: 1 }),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockEmployees[0], error: null }),
    })),
  })),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue(null),
}));

describe('GET /api/employees', () => {
  it('returns employees for authenticated user', async () => {
    const req = new NextRequest('http://localhost/api/employees');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('returns paginated results with page and limit params', async () => {
    const req = new NextRequest('http://localhost/api/employees?page=2&limit=10');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(2);
    expect(body.limit).toBe(10);
  });
});

describe('POST /api/employees', () => {
  it('creates a new employee record', async () => {
    const req = new NextRequest('http://localhost/api/employees', {
      method: 'POST',
      body: JSON.stringify({ profile_id: 'user-456', job_title: 'Designer', department: 'Design' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});