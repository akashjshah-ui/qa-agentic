// @ts-check
const { test, expect } = require('@playwright/test');

const STUDIO_PHONE = '408-507-0979';
const STUDIO_EMAIL = 'dolly@paintiliciousart.com';
const STUDIO_CITY = 'Milpitas';

test.describe('Contact / Location Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/location');
  });

  test('loads successfully with a 200 status', async ({ request }) => {
    const response = await request.get('/location');
    expect(response.status()).toBe(200);
  });

  test('has correct page title containing Paintilicious', async ({ page }) => {
    await expect(page).toHaveTitle(/Paintilicious/i);
  });

  test('displays studio phone number', async ({ page }) => {
    await expect(page.getByText(STUDIO_PHONE)).toBeVisible();
  });

  test('displays studio email address', async ({ page }) => {
    await expect(page.getByText(STUDIO_EMAIL)).toBeVisible();
  });

  test('displays city name Milpitas', async ({ page }) => {
    await expect(page.getByText(STUDIO_CITY)).toBeVisible();
  });

  test('phone number is a callable tel: link', async ({ page }) => {
    const telLink = page.locator(`a[href*="tel:"]`);
    await expect(telLink.first()).toBeVisible();
  });

  test('email is a mailto: link', async ({ page }) => {
    const mailtoLink = page.locator(`a[href*="mailto:"]`);
    await expect(mailtoLink.first()).toBeVisible();
  });

  test('displays an embedded map or directions link', async ({ page }) => {
    const mapFrame = page.locator('iframe[src*="map"], iframe[src*="google"]');
    const mapLink = page.getByRole('link', { name: /direction|map|get here/i });

    const hasMap = (await mapFrame.count()) > 0;
    const hasMapLink = (await mapLink.count()) > 0;

    expect(hasMap || hasMapLink).toBeTruthy();
  });

  test('navigating from homepage contact link lands on /location', async ({ page }) => {
    await page.goto('/');
    const contactLink = page.getByRole('link', { name: /contact|location|find us/i }).first();
    await contactLink.click();
    await expect(page).toHaveURL(/\/location/);
  });
});
