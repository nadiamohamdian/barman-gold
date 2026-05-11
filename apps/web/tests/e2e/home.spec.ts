import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display header and search functionality', async ({ page }) => {
    // Check if header is visible
    await expect(page.locator('header')).toBeVisible();
    
    // Check if search input is present
    const searchInput = page.locator('input[type="search"], input[placeholder*="جستجو"], input[aria-label*="جستجو"]');
    await expect(searchInput).toBeVisible();
  });

  test('should display gold price ticker', async ({ page }) => {
    // Check if price ticker is visible
    const priceTicker = page.locator('[data-testid="price-ticker"], .price-ticker, [class*="price"], [class*="ticker"]');
    await expect(priceTicker).toBeVisible();
  });

  test('should display featured products section', async ({ page }) => {
    // Check if products section is visible
    const productsSection = page.locator('[data-testid="featured-products"], .featured-products, [class*="products"]');
    await expect(productsSection).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Check if main navigation links are present
    const navLinks = page.locator('nav a, header a');
    await expect(navLinks.first()).toBeVisible();
    
    // Check if at least one navigation link is clickable
    const firstNavLink = navLinks.first();
    await expect(firstNavLink).toBeEnabled();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('header')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('header')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('header')).toBeVisible();
  });
});
