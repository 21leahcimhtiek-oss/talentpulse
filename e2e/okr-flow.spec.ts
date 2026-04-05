import { test, expect } from '@playwright/test';

test.describe('OKR Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Assumes test user is seeded in the DB
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL ?? 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD ?? 'test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('user can view OKRs list', async ({ page }) => {
    await page.goto('/okrs');
    await expect(page.getByRole('heading', { name: 'OKRs' })).toBeVisible();
    await expect(page.getByText('objectives tracked')).toBeVisible();
  });

  test('OKR status badges are visible', async ({ page }) => {
    await page.goto('/okrs');
    const onTrack = page.getByText('On Track');
    const atRisk = page.getByText('At Risk');
    await expect(onTrack).toBeVisible();
    await expect(atRisk).toBeVisible();
  });

  test('user can navigate to employee OKR detail', async ({ page }) => {
    await page.goto('/employees');
    const firstEmployee = page.locator('[href^="/employees/"]').first();
    if (await firstEmployee.count() > 0) {
      await firstEmployee.click();
      await expect(page.getByRole('heading', { name: 'OKRs' })).toBeVisible();
    }
  });
});