// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Classes Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/classes');
  });

  test('loads successfully with a 200 status', async ({ request }) => {
    const response = await request.get('/classes');
    expect(response.status()).toBe(200);
  });

  test('has correct page title containing Paintilicious', async ({ page }) => {
    await expect(page).toHaveTitle(/Paintilicious/i);
  });

  test('displays drawing or painting class information', async ({ page }) => {
    await expect(
      page.getByText(/drawing|painting/i).first()
    ).toBeVisible();
  });

  test('displays clay art or pottery information', async ({ page }) => {
    await expect(
      page.getByText(/clay|pottery/i).first()
    ).toBeVisible();
  });

  test('shows class duration or schedule details', async ({ page }) => {
    // Classes are described as 10-week courses
    await expect(
      page.getByText(/week|session|schedule|duration/i).first()
    ).toBeVisible();
  });

  test('shows class enrollment or registration option', async ({ page }) => {
    const enrollBtn = page.getByRole('link', { name: /enroll|register|sign up|book|buy|get ticket/i });
    const enrollCount = await enrollBtn.count();
    // At least one enrollment CTA should be present
    expect(enrollCount).toBeGreaterThan(0);
  });

  test('navigating from homepage Classes link lands on /classes', async ({ page }) => {
    await page.goto('/');
    const classesLink = page.getByRole('link', { name: /^classes$/i }).first();
    await classesLink.click();
    await expect(page).toHaveURL(/\/classes/);
  });

  test('lists multiple class types', async ({ page }) => {
    // Should have more than one class/program described
    const classItems = page.locator('section, article, .class, [class*="class"], li').filter({
      hasText: /class|course|workshop/i,
    });
    const count = await classItems.count();
    expect(count).toBeGreaterThan(1);
  });

  test('displays skill level information (beginner/intermediate)', async ({ page }) => {
    await expect(
      page.getByText(/beginner|intermediate|all level|all age/i).first()
    ).toBeVisible();
  });
});
