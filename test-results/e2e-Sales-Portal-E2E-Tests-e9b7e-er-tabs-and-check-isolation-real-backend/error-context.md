# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\real-backend\e2e.test.ts >> Sales Portal E2E Tests with Real Backend >> should view Heads list, search, view details, ledger tabs, and check isolation
- Location: tests\real-backend\e2e.test.ts:51:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text="Alice A_Head"')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text="Alice A_Head"')

```

```yaml
- complementary:
  - img
  - text: Texas travels Sales Portal
  - navigation:
    - link "Dashboard":
      - /url: /dashboard
    - link "Heads":
      - /url: /heads
    - link "Leads":
      - /url: /leads
    - button "Bookings"
    - link "Flight Tickets":
      - /url: /bookings/flights
    - link "Hotel Bookings":
      - /url: /bookings/hotels
    - link "Visa Services":
      - /url: /bookings/visas
    - link "VFS Appointments":
      - /url: /bookings/vfs
    - link "Holiday Packages":
      - /url: /bookings/holidays
    - link "Transportation":
      - /url: /bookings/transport
    - link "Other Services":
      - /url: /bookings/other-services
    - link "Cash Management":
      - /url: /cash-management
    - link "Performance":
      - /url: /performance
  - text: JS John Salesman Sales Executive
  - button
  - text: Dev Identity DEV
  - combobox "Switch development identity":
    - option "Salesman A — John (Dev ID 1)" [selected]
    - option "Salesman B — Sarah (Dev ID 2)"
    - option "No Permission — Guest (Dev ID 3)"
  - paragraph: Switching reloads the page. Identity persists via localStorage.
- banner:
  - navigation "breadcrumb":
    - list:
      - listitem:
        - link "Home":
          - /url: /dashboard
      - listitem:
        - link "Heads" [disabled]
  - button
  - button
  - text: John Salesman Sales Executive JS
- main:
  - heading "Heads" [level=1]
  - paragraph: View and manage primary customer balance ledgers.
  - textbox "Search name, email, phone..."
  - text: "Rows per page:"
  - combobox:
    - option "10" [selected]
    - option "20"
    - option "50"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Sales Portal E2E Tests with Real Backend', () => {
  4   |   // Test 1: Verification of Dashboard stats for Salesman A & B, and error handling for Guest
  5   |   test('should load Dashboard metrics and verify stats per identity and error handling', async ({ page }) => {
  6   |     // 1. Initial load - should default to first identity (Salesman A)
  7   |     await page.goto('/dashboard');
  8   |     await expect(page).toHaveURL(/\/dashboard/);
  9   |     await expect(page.locator('h1')).toHaveText('Dashboard');
  10  | 
  11  |     // Wait for metrics card elements to load
  12  |     await expect(page.locator('text=Total Sales')).toBeVisible();
  13  |     await expect(page.locator('text=Gross Profit')).toBeVisible();
  14  |     await expect(page.locator('text=Cash In Hand')).toBeVisible();
  15  | 
  16  |     // Verify stat labels are rendered
  17  |     await expect(page.locator('text=Total Sales')).toBeVisible();
  18  |     await expect(page.locator('text=Gross Profit')).toBeVisible();
  19  |     await expect(page.locator('text=Cash In Hand')).toBeVisible();
  20  |     // Verify at least one BHD-formatted monetary value is present on the page
  21  |     await expect(page.locator('text=/\d+\.\d{3}\s*BHD/').first()).toBeVisible();
  22  | 
  23  |     // Check Trend placeholder for API gap
  24  |     await expect(page.locator('text=Trend Data Unavailable')).toBeVisible();
  25  | 
  26  |     // 2. Switch Identity to Salesman B (Sarah) via Dev Identity select
  27  |     const devSelect = page.locator('select[aria-label="Switch development identity"]');
  28  |     await expect(devSelect).toBeVisible();
  29  |     await devSelect.selectOption('salesman-b');
  30  |     
  31  |     // Page reloads automatically on identity switch
  32  |     await page.waitForURL(/\/dashboard/);
  33  |     await expect(page.locator('h1')).toHaveText('Dashboard');
  34  | 
  35  |     // Verify Salesman B stats — labels and at least one BHD value
  36  |     await expect(page.locator('text=Total Sales')).toBeVisible();
  37  |     await expect(page.locator('text=Gross Profit')).toBeVisible();
  38  |     await expect(page.locator('text=Cash In Hand')).toBeVisible();
  39  |     await expect(page.locator('text=/\d+\.\d{3}\s*BHD/').first()).toBeVisible();
  40  | 
  41  |     // 3. Switch Identity to Guest (no-permission) and verify 403 Forbidden handling (ProblemDetails handling)
  42  |     await devSelect.selectOption('no-permission');
  43  |     await page.waitForURL(/\/dashboard/);
  44  | 
  45  |     // Verify handled error block / alert is visible
  46  |     await expect(page.locator('text=Dashboard Loading Failed')).toBeVisible();
  47  |     await expect(page.locator('text=Forbidden')).toBeVisible();
  48  |   });
  49  | 
  50  |   // Test 2: Verification of Customer Heads list navigation, search, and details isolation
  51  |   test('should view Heads list, search, view details, ledger tabs, and check isolation', async ({ page }) => {
  52  |     // 1. Log in as Salesman A
  53  |     await page.goto('/dashboard');
  54  |     const devSelect = page.locator('select[aria-label="Switch development identity"]');
  55  |     await devSelect.selectOption('salesman-a');
  56  |     await page.waitForURL(/\/dashboard/);
  57  | 
  58  |     // 2. Go to /heads list
  59  |     const headsLink = page.locator('aside nav').getByRole('link', { name: 'Heads' });
  60  |     await headsLink.click();
  61  |     await page.waitForURL(/\/heads/);
  62  |     await expect(page.locator('h1')).toHaveText('Heads');
  63  | 
  64  |     // Verify Alice is in the list
> 65  |     await expect(page.locator('text="Alice A_Head"')).toBeVisible();
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  66  |     await expect(page.locator('text=A_Head')).toBeVisible();
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
```