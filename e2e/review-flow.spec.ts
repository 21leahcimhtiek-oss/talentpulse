import { test, expect } from '@playwright/test';

test.describe('Review Form', () => {
  test('review form page loads at /reviews/new', async ({ page }) => {
    await page.goto('/reviews/new');
    await expect(page).toHaveURL('/reviews/new');
    await expect(page.getByRole('heading', { name: /new review|submit review|create review/i })).toBeVisible();
  });

  test('form has employee selector, period, score, strengths, and improvements fields', async ({ page }) => {
    await page.goto('/reviews/new');
    await expect(
      page.getByLabel(/employee/i).or(page.locator('select[name="employee_id"]'))
    ).toBeVisible();
    await expect(
      page.getByLabel(/period/i).or(page.locator('[name="period"]'))
    ).toBeVisible();
    await expect(
      page.getByLabel(/score/i).or(page.locator('[name="score"]'))
    ).toBeVisible();
    await expect(
      page.getByLabel(/strengths/i).or(page.locator('[name="strengths"]'))
    ).toBeVisible();
    await expect(
      page.getByLabel(/improvements|areas to improve/i).or(page.locator('[name="improvements"]'))
    ).toBeVisible();
  });

  test('form shows validation error when strengths is too short', async ({ page }) => {
    await page.goto('/reviews/new');
    const strengthsField = page.getByLabel(/strengths/i).or(page.locator('[name="strengths"]'));
    await strengthsField.fill('ok');
    const submitBtn = page.getByRole('button', { name: /submit|save|create/i });
    await submitBtn.click();
    const errorMsg = page.getByText(/strengths.*required|too short|minimum/i)
      .or(page.locator('[data-testid="strengths-error"]'));
    await expect(errorMsg).toBeVisible();
  });
});

test.describe('Review List', () => {
  test('review list page loads and shows reviews', async ({ page }) => {
    await page.goto('/reviews');
    await expect(page).toHaveURL('/reviews');
    const reviewList = page.getByTestId('review-list')
      .or(page.locator('ul, [role="list"]').filter({ hasText: /review/i }));
    await expect(reviewList).toBeVisible();
  });

  test('new review button navigates to /reviews/new', async ({ page }) => {
    await page.goto('/reviews');
    const newReviewBtn = page.getByRole('link', { name: /new review|add review|create review/i })
      .or(page.getByRole('button', { name: /new review|add review/i }));
    await newReviewBtn.click();
    await expect(page).toHaveURL('/reviews/new');
  });
});

test.describe('Landing Page', () => {
  test('landing page loads and hero section is visible', async ({ page }) => {
    await page.goto('/');
    const heroSection = page.getByTestId('hero-section')
      .or(page.getByRole('banner'))
      .or(page.locator('#hero, [data-testid="hero"]'));
    await expect(heroSection).toBeVisible();
  });

  test('pricing cards show correct prices $79 and $199', async ({ page }) => {
    await page.goto('/');
    const pricingArea = page.locator('#pricing, [data-testid="pricing-section"]');
    await pricingArea.scrollIntoViewIfNeeded().catch(() => {});
    await expect(page.getByText(/\$79/)).toBeVisible();
    await expect(page.getByText(/\$199/)).toBeVisible();
  });
});

test.describe('Auth Pages', () => {
  test('sign up page loads with required fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('[type="email"]')).toBeVisible();
    await expect(page.locator('[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up|create account|register/i })).toBeVisible();
  });

  test('reset password page shows email input', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.locator('[type="email"]')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /send|reset|submit/i })
    ).toBeVisible();
  });
});