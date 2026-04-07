// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test('homepage is accessible at root URL', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBe(200);
  });

  test('/classes is accessible', async ({ page }) => {
    const response = await page.goto('/classes');
    expect(response.status()).toBe(200);
  });

  test('/location is accessible', async ({ page }) => {
    const response = await page.goto('/location');
    expect(response.status()).toBe(200);
  });

  test('all nav links on the homepage are not broken', async ({ page }) => {
    await page.goto('/');

    const navLinks = await page.locator('nav a, header a').evaluateAll((anchors) =>
      anchors
        .map((a) => a.getAttribute('href'))
        .filter((href) => href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:'))
    );

    for (const href of navLinks) {
      const response = await page.request.get(href.startsWith('http') ? href : `/${href.replace(/^\//, '')}`);
      expect(response.status(), `Expected ${href} to return 200`).toBeLessThan(400);
    }
  });

  test('clicking the logo navigates back to homepage', async ({ page }) => {
    await page.goto('/classes');
    const logo = page.locator('header a, nav a').filter({ hasText: /Paintilicious/i }).first();
    const logoCount = await logo.count();
    if (logoCount > 0) {
      await logo.click();
      await expect(page).toHaveURL(/\/$|\/index/);
    }
  });

  test('page title is present on every main page', async ({ page }) => {
    const pages = ['/', '/classes', '/location'];
    for (const path of pages) {
      await page.goto(path);
      const title = await page.title();
      expect(title.length, `Expected non-empty title on ${path}`).toBeGreaterThan(0);
    }
  });

  test('no page returns a 404 or 500 for known routes', async ({ request }) => {
    const routes = ['/', '/classes', '/location'];
    for (const route of routes) {
      const response = await request.get(route);
      expect(response.status(), `${route} should not return an error`).toBeLessThan(400);
    }
  });

  test('pages load within 5 seconds', async ({ page }) => {
    const routes = ['/', '/classes', '/location'];
    for (const route of routes) {
      const start = Date.now();
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const elapsed = Date.now() - start;
      expect(elapsed, `${route} took too long to load`).toBeLessThan(5000);
    }
  });
});
