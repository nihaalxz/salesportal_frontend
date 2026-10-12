import { test, expect } from '@playwright/test';

test.describe('Sales Portal E2E Tests with Real Backend', () => {
  // Test 1: Verification of Dashboard stats for Salesman A & B, and error handling for Guest
  test('should load Dashboard metrics and verify stats per identity and error handling', async ({ page }) => {
    // 1. Initial load - should default to first identity (Salesman A)
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toHaveText('Dashboard');

    // Wait for metrics card elements to load
    await expect(page.locator('text=Total Sales')).toBeVisible();
    await expect(page.locator('text=Gross Profit')).toBeVisible();
    await expect(page.locator('text=Cash In Hand')).toBeVisible();

    // Verify stat labels are rendered
    await expect(page.locator('text=Total Sales')).toBeVisible();
    await expect(page.locator('text=Gross Profit')).toBeVisible();
    await expect(page.locator('text=Cash In Hand')).toBeVisible();
    // Verify at least one BHD-formatted monetary value is present on the page
    await expect(page.locator('text=/\d+\.\d{3}\s*BHD/').first()).toBeVisible();

    // Check Trend placeholder for API gap
    await expect(page.locator('text=Trend Data Unavailable')).toBeVisible();

    // 2. Switch Identity to Salesman B (Sarah) via Dev Identity select
    const devSelect = page.locator('select[aria-label="Switch development identity"]');
    await expect(devSelect).toBeVisible();
    await devSelect.selectOption('salesman-b');
    
    // Page reloads automatically on identity switch
    await page.waitForURL(/\/dashboard/);
    await expect(page.locator('h1')).toHaveText('Dashboard');

    // Verify Salesman B stats — labels and at least one BHD value
    await expect(page.locator('text=Total Sales')).toBeVisible();
    await expect(page.locator('text=Gross Profit')).toBeVisible();
    await expect(page.locator('text=Cash In Hand')).toBeVisible();
    await expect(page.locator('text=/\d+\.\d{3}\s*BHD/').first()).toBeVisible();

    // 3. Switch Identity to Guest (no-permission) and verify 403 Forbidden handling (ProblemDetails handling)
    await devSelect.selectOption('no-permission');
    await page.waitForURL(/\/dashboard/);

    // Verify handled error block / alert is visible
    await expect(page.locator('text=Dashboard Loading Failed')).toBeVisible();
    await expect(page.locator('text=Forbidden')).toBeVisible();
  });

  // Test 2: Verification of Customer Heads list navigation, search, and details isolation
  test('should view Heads list, search, view details, ledger tabs, and check isolation', async ({ page }) => {
    // 1. Log in as Salesman A
    await page.goto('/dashboard');
    const devSelect = page.locator('select[aria-label="Switch development identity"]');
    await devSelect.selectOption('salesman-a');
    await page.waitForURL(/\/dashboard/);

    // 2. Go to /heads list
    const headsLink = page.locator('aside nav').getByRole('link', { name: 'Heads' });
    await headsLink.click();
    await page.waitForURL(/\/heads/);
    await expect(page.locator('h1')).toHaveText('Heads');

    // Verify Alice is in the list
    await expect(page.locator('text="Alice A_Head"')).toBeVisible();
    await expect(page.locator('text=A_Head')).toBeVisible();
    await expect(page.locator('text=alice.a@example.com')).toBeVisible();

    // Verify search functionality
    const searchInput = page.locator('input[placeholder*="Search name"]');
    await expect(searchInput).toBeVisible();

    // Search for "Alice"
    await searchInput.fill('Alice');
    await page.waitForTimeout(500); // Wait for debounce
    await expect(page.getByRole('cell', { name: 'Alice A_Head' })).toBeVisible();

    // Search for non-existent head "Bob" (since Bob is owned by Sarah)
    await searchInput.fill('Bob');
    await page.waitForTimeout(500); // Wait for debounce
    await expect(page.locator('text=No customer records found')).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // 3. Navigate to Alice's detail page
    const aliceRow = page.locator('tbody tr').filter({ hasText: 'Alice' });
    await aliceRow.click();
    await page.waitForURL(/\/heads\/1/);
    
    // Verify detail headers and values
    await expect(page.locator('h1')).toHaveText(/Alice\s+A_Head/);
    await expect(page.locator('text=alice.a@example.com')).toBeVisible();
    await expect(page.locator('text=97311111111')).toBeVisible();
    await expect(page.locator('text=Bahraini')).toBeVisible();
    await expect(page.locator('text=1,500.000 BHD')).toBeVisible(); // Balance
    await expect(page.locator('text=200.000 BHD')).toBeVisible(); // Wallet
    await expect(page.locator('text=Manama Block 312')).toBeVisible(); // Address

    // Check Transaction Ledger tab
    const ledgerTab = page.locator('button:has-text("Transaction Ledger")');
    await expect(ledgerTab).toBeVisible();
    await ledgerTab.click();
    await expect(page).toHaveURL(/tab=ledger/);

    // Verify ledger items are populated from real backend (Flight booking and Receipt)
    await expect(page.locator('text=Flight Ticket Booking TX-FL-90210')).toBeVisible();
    await expect(page.locator('text=Deposit payment for flights')).toBeVisible();

    // Check Outstanding Bookings tab
    const bookingsTab = page.locator('button:has-text("Outstanding Bookings")');
    await expect(bookingsTab).toBeVisible();
    await bookingsTab.click();
    await expect(page).toHaveURL(/tab=bookings/);

    // Verify contract gap message
    await expect(page.locator('text=Outstanding Bookings Unavailable')).toBeVisible();

    // 4. Test Cross-Owner Details Isolation:
    // Salesman A is currently logged in. Direct navigation to Sarah's Head (ID 2) must result in a 404.
    await page.goto('/heads/2');
    
    // The UI should display a Not Found error message or title gracefully
    await expect(page.locator('text=Not Found')).toBeVisible();
  });

  // Test 3: SvelteKit navigation robustness (race conditions, fast page swapping)
  test('should handle rapid navigation changes without crashing or showing stale data', async ({ page }) => {
    await page.goto('/dashboard');
    const devSelect = page.locator('select[aria-label="Switch development identity"]');
    await devSelect.selectOption('salesman-a');
    await page.waitForURL(/\/dashboard/);

    // Rapidly toggle between Dashboard, Heads, and Leads multiple times to trigger potential race conditions
    const headsLink = page.locator('aside nav').getByRole('link', { name: 'Heads' });
    const dashboardLink = page.locator('aside nav').getByRole('link', { name: 'Dashboard' });

    for (let i = 0; i < 3; i++) {
      await headsLink.click();
      // No wait, click dashboard immediately
      await dashboardLink.click();
      // No wait, click heads again
      await headsLink.click();
    }

    // Wait for the final route to stabilize and verify correctness
    await page.waitForURL(/\/heads/);
    await expect(page.locator('h1')).toHaveText('Heads');
    await expect(page.locator('text="Alice A_Head"')).toBeVisible();
  });

  // Test 4: Viewport responsiveness check across mobile, tablet, and desktop
  test('should adjust layout gracefully on smaller screens without hiding main content', async ({ page }) => {
    await page.goto('/dashboard');
    const devSelect = page.locator('select[aria-label="Switch development identity"]');
    await devSelect.selectOption('salesman-a');
    await page.waitForURL(/\/dashboard/);

    // Resize viewport to mobile dimensions
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Header should still render and be readable
    await expect(page.locator('h1')).toHaveText('Dashboard');
    
    // Check that stats cards stack and are visible
    await expect(page.locator('text=Total Sales')).toBeVisible();

    // Check basic accessibility properties on layout
    const nav = page.locator('aside nav');
    // On small mobile screens, the navigation might be collapsed/responsive menu, but still present
    await expect(nav).toBeAttached();
  });
});
