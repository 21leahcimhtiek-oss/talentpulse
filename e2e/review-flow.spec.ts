import { test, expect } from '@playwright/test';

test.describe('Performance Review Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL ?? 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD ?? 'test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('user can view reviews list', async ({ page }) => {
    await page.goto('/reviews');
    await expect(page.getByRole('heading', { name: 'Performance Reviews' })).toBeVisible();
  });

  test('new review page renders form', async ({ page }) => {
    await page.goto('/reviews/new');
    await expect(page.getByRole('heading', { name: 'New Performance Review' })).toBeVisible();
    await expect(page.getByText('AI bias detection runs automatically')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit Review' })).toBeVisible();
  });

  test('review form has all required fields', async ({ page }) => {
    await page.goto('/reviews/new');
    await expect(page.getByLabel('Employee')).toBeVisible();
    await expect(page.getByLabel(/Review Cycle/)).toBeVisible();
    await expect(page.getByLabel(/Strengths/)).toBeVisible();
    await expect(page.getByLabel(/Areas for Improvement/)).toBeVisible();
  });
});