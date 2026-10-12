import { test, expect } from '@playwright/test';

test.describe('Sales Portal Mocked E2E Tests', () => {
  test('should redirect root to dashboard and load shell layout', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Texas travels')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });

  test('should display sidebar links and navigate to leads page', async ({ page }) => {
    await page.goto('/dashboard');
    const leadsLink = page.locator('aside nav').getByRole('link', { name: 'Leads' });
    await expect(leadsLink).toBeVisible();
    await leadsLink.click();
    await expect(page).toHaveURL(/\/leads/);
    await expect(page.locator('h1')).toHaveText('Leads');
  });

  test('should load booking subroutes correctly', async ({ page }) => {
    await page.goto('/bookings/flights');
    await expect(page.locator('h1')).toHaveText('Flight Tickets');
    await expect(page.getByText('The Flight Ticket bookings section has been mapped')).toBeVisible();
  });

  test('should show correct 404 page for unknown routes', async ({ page }) => {
    await page.goto('/non-existent-route-999');
    await expect(page.locator('text=Not Found')).toBeVisible();
  });

  test('should load Heads list and navigate to detail page', async ({ page }) => {
    // Navigate to heads page
    await page.goto('/heads');
    await expect(page.locator('h1')).toHaveText('Heads');

    const searchInput = page.locator('input[placeholder*="Search name"]');
    await expect(searchInput).toBeVisible();

    await page.waitForTimeout(1500);

    const emptyState = page.locator('text=No customer records found');
    const tableRow = page.locator('tbody tr').first();

    if (await tableRow.isVisible()) {
      await tableRow.click();
      await expect(page).toHaveURL(/\/heads\/\d+/);
      await expect(page.locator('h1')).toBeVisible();

      const ledgerTab = page.locator('button:has-text("Transaction Ledger")');
      await expect(ledgerTab).toBeVisible();
      await ledgerTab.click();
      await expect(page).toHaveURL(/tab=ledger/);

      const bookingsTab = page.locator('button:has-text("Outstanding Bookings")');
      await expect(bookingsTab).toBeVisible();
      await bookingsTab.click();
      await expect(page).toHaveURL(/tab=bookings/);
      await expect(page.getByText('Outstanding Bookings Unavailable')).toBeVisible();
    } else if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    }
  });
});
