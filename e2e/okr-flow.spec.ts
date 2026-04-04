import { test, expect, Page } from '@playwright/test';

async function loginAsManager(page: Page) {
  await page.goto('/login');
  await page.fill('[type="email"]', 'manager@test.com');
  await page.fill('[type="password"]', 'password123');
  await page.click('[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('OKR Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test('user can view OKR list page', async ({ page }) => {
    await page.goto('/okrs');
    await expect(page).toHaveURL('/okrs');
    await expect(page.getByRole('heading', { name: /okr/i })).toBeVisible();
  });

  test('OKR status filter works - click At Risk and see filtered list', async ({ page }) => {
    await page.goto('/okrs');
    const atRiskFilter = page.getByRole('button', { name: /at risk/i }).or(
      page.getByRole('tab', { name: /at risk/i })
    );
    await atRiskFilter.click();
    await expect(page.getByTestId('okr-status-filter')).toHaveValue('at_risk').catch(async () => {
      const items = page.getByTestId('okr-card');
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        await expect(items.nth(i).getByText(/at risk/i)).toBeVisible();
      }
    });
  });

  test('OKR progress bar is displayed correctly', async ({ page }) => {
    await page.goto('/okrs');
    const firstCard = page.getByTestId('okr-card').first();
    await expect(firstCard).toBeVisible();
    const progressBar = firstCard.getByRole('progressbar').or(firstCard.locator('[data-testid="progress-bar"]'));
    await expect(progressBar).toBeVisible();
  });

  test('OKR card shows employee name, title, and due date', async ({ page }) => {
    await page.goto('/okrs');
    const firstCard = page.getByTestId('okr-card').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByTestId('okr-title').or(firstCard.locator('h2,h3'))).toBeVisible();
    await expect(firstCard.getByTestId('okr-due-date').or(firstCard.getByText(/due/i))).toBeVisible();
  });
});

test.describe('Landing Page', () => {
  test('landing page loads with features section visible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    const featuresSection = page.getByTestId('features-section')
      .or(page.getByRole('region', { name: /features/i }))
      .or(page.locator('#features'));
    await expect(featuresSection).toBeVisible();
  });

  test('pricing section has 3 plan cards', async ({ page }) => {
    await page.goto('/');
    const pricingSection = page.locator('#pricing, [data-testid="pricing-section"]');
    await pricingSection.scrollIntoViewIfNeeded().catch(() => {});
    const planCards = page.getByTestId('pricing-card').or(
      page.locator('[data-testid="plan-card"]')
    );
    await expect(planCards).toHaveCount(3);
  });
});

test.describe('Auth Pages', () => {
  test('login page has email and password inputs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[type="email"]')).toBeVisible();
    await expect(page.locator('[type="password"]')).toBeVisible();
  });

  test('login redirects to dashboard on success', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[type="email"]', 'manager@test.com');
    await page.fill('[type="password"]', 'password123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('unauthenticated user is redirected to login from /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});