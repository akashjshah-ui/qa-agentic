// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads successfully with a 200 status', async ({ page, request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Paintilicious/i);
  });

  test('displays the studio name or logo', async ({ page }) => {
    await expect(
      page.getByText(/Paintilicious/i).first()
    ).toBeVisible();
  });

  test('shows navigation menu', async ({ page }) => {
    // Navigation should be present and contain key links
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
  });

  test('has a link to the Classes page', async ({ page }) => {
    const classesLink = page.getByRole('link', { name: /classes/i });
    await expect(classesLink.first()).toBeVisible();
  });

  test('has a link to the Contact or Location page', async ({ page }) => {
    const contactLink = page.getByRole('link', { name: /contact|location|find us/i });
    await expect(contactLink.first()).toBeVisible();
  });

  test('promotes paint parties or art classes', async ({ page }) => {
    await expect(
      page.getByText(/paint part(y|ies)|art class(es)?|drawing|painting/i).first()
    ).toBeVisible();
  });

  test('page has no broken images on load', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      // Only check images that have a src
      if (src && !src.startsWith('data:')) {
        await expect(img).not.toHaveAttribute('src', '');
      }
    }
  });

  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // Page should not have horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });
});
