# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\real-backend\e2e.test.ts >> Sales Portal E2E Tests with Real Backend >> should adjust layout gracefully on smaller screens without hiding main content
- Location: tests\real-backend\e2e.test.ts:154:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Total Sales')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Total Sales')

```

```yaml
- banner:
  - button
  - button
  - button
  - text: JS
- main:
  - heading "Dashboard" [level=1]
  - paragraph: Overview of your sales aggregates and booking totals.
  - button "Reload Metrics"
  - alert: Dashboard Loading Failed An unexpected error occurred.
  - button "Retry Fetch"
```

# Test source

```ts
  67  |     await expect(page.locator('text=alice.a@example.com')).toBeVisible();
  68  | 
  69  |     // Verify search functionality
  70  |     const searchInput = page.locator('input[placeholder*="Search name"]');
  71  |     await expect(searchInput).toBeVisible();
  72  | 
  73  |     // Search for "Alice"
  74  |     await searchInput.fill('Alice');
  75  |     await page.waitForTimeout(500); // Wait for debounce
  76  |     await expect(page.getByRole('cell', { name: 'Alice A_Head' })).toBeVisible();
  77  | 
  78  |     // Search for non-existent head "Bob" (since Bob is owned by Sarah)
  79  |     await searchInput.fill('Bob');
  80  |     await page.waitForTimeout(500); // Wait for debounce
  81  |     await expect(page.locator('text=No customer records found')).toBeVisible();
  82  | 
  83  |     // Clear search
  84  |     await searchInput.fill('');
  85  |     await page.waitForTimeout(500);
  86  | 
  87  |     // 3. Navigate to Alice's detail page
  88  |     const aliceRow = page.locator('tbody tr').filter({ hasText: 'Alice' });
  89  |     await aliceRow.click();
  90  |     await page.waitForURL(/\/heads\/1/);
  91  |     
  92  |     // Verify detail headers and values
  93  |     await expect(page.locator('h1')).toHaveText(/Alice\s+A_Head/);
  94  |     await expect(page.locator('text=alice.a@example.com')).toBeVisible();
  95  |     await expect(page.locator('text=97311111111')).toBeVisible();
  96  |     await expect(page.locator('text=Bahraini')).toBeVisible();
  97  |     await expect(page.locator('text=1,500.000 BHD')).toBeVisible(); // Balance
  98  |     await expect(page.locator('text=200.000 BHD')).toBeVisible(); // Wallet
  99  |     await expect(page.locator('text=Manama Block 312')).toBeVisible(); // Address
  100 | 
  101 |     // Check Transaction Ledger tab
  102 |     const ledgerTab = page.locator('button:has-text("Transaction Ledger")');
  103 |     await expect(ledgerTab).toBeVisible();
  104 |     await ledgerTab.click();
  105 |     await expect(page).toHaveURL(/tab=ledger/);
  106 | 
  107 |     // Verify ledger items are populated from real backend (Flight booking and Receipt)
  108 |     await expect(page.locator('text=Flight Ticket Booking TX-FL-90210')).toBeVisible();
  109 |     await expect(page.locator('text=Deposit payment for flights')).toBeVisible();
  110 | 
  111 |     // Check Outstanding Bookings tab
  112 |     const bookingsTab = page.locator('button:has-text("Outstanding Bookings")');
  113 |     await expect(bookingsTab).toBeVisible();
  114 |     await bookingsTab.click();
  115 |     await expect(page).toHaveURL(/tab=bookings/);
  116 | 
  117 |     // Verify contract gap message
  118 |     await expect(page.locator('text=Outstanding Bookings Unavailable')).toBeVisible();
  119 | 
  120 |     // 4. Test Cross-Owner Details Isolation:
  121 |     // Salesman A is currently logged in. Direct navigation to Sarah's Head (ID 2) must result in a 404.
  122 |     await page.goto('/heads/2');
  123 |     
  124 |     // The UI should display a Not Found error message or title gracefully
  125 |     await expect(page.locator('text=Not Found')).toBeVisible();
  126 |   });
  127 | 
  128 |   // Test 3: SvelteKit navigation robustness (race conditions, fast page swapping)
  129 |   test('should handle rapid navigation changes without crashing or showing stale data', async ({ page }) => {
  130 |     await page.goto('/dashboard');
  131 |     const devSelect = page.locator('select[aria-label="Switch development identity"]');
  132 |     await devSelect.selectOption('salesman-a');
  133 |     await page.waitForURL(/\/dashboard/);
  134 | 
  135 |     // Rapidly toggle between Dashboard, Heads, and Leads multiple times to trigger potential race conditions
  136 |     const headsLink = page.locator('aside nav').getByRole('link', { name: 'Heads' });
  137 |     const dashboardLink = page.locator('aside nav').getByRole('link', { name: 'Dashboard' });
  138 | 
  139 |     for (let i = 0; i < 3; i++) {
  140 |       await headsLink.click();
  141 |       // No wait, click dashboard immediately
  142 |       await dashboardLink.click();
  143 |       // No wait, click heads again
  144 |       await headsLink.click();
  145 |     }
  146 | 
  147 |     // Wait for the final route to stabilize and verify correctness
  148 |     await page.waitForURL(/\/heads/);
  149 |     await expect(page.locator('h1')).toHaveText('Heads');
  150 |     await expect(page.locator('text="Alice A_Head"')).toBeVisible();
  151 |   });
  152 | 
  153 |   // Test 4: Viewport responsiveness check across mobile, tablet, and desktop
  154 |   test('should adjust layout gracefully on smaller screens without hiding main content', async ({ page }) => {
  155 |     await page.goto('/dashboard');
  156 |     const devSelect = page.locator('select[aria-label="Switch development identity"]');
  157 |     await devSelect.selectOption('salesman-a');
  158 |     await page.waitForURL(/\/dashboard/);
  159 | 
  160 |     // Resize viewport to mobile dimensions
  161 |     await page.setViewportSize({ width: 375, height: 667 });
  162 |     
  163 |     // Header should still render and be readable
  164 |     await expect(page.locator('h1')).toHaveText('Dashboard');
  165 |     
  166 |     // Check that stats cards stack and are visible
> 167 |     await expect(page.locator('text=Total Sales')).toBeVisible();
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  168 | 
  169 |     // Check basic accessibility properties on layout
  170 |     const nav = page.locator('aside nav');
  171 |     // On small mobile screens, the navigation might be collapsed/responsive menu, but still present
  172 |     await expect(nav).toBeAttached();
  173 |   });
  174 | });
  175 | 
```