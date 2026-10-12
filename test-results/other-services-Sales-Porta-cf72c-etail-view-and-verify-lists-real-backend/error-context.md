# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\real-backend\other-services.test.ts >> Sales Portal Other Services E2E Tests >> should create a new other service booking, redirect to detail view, and verify lists
- Location: tests\real-backend\other-services.test.ts:4:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:5173/bookings/other-services"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e5]:
    - generic [ref=e6]:
      - img [ref=e8]
      - generic [ref=e10]:
        - generic [ref=e11]: Texas travels
        - generic [ref=e12]: Sales Portal
    - navigation [ref=e13]:
      - generic [ref=e14]:
        - link "Dashboard" [ref=e15] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e16]
          - generic [ref=e21]: Dashboard
        - link "Heads" [ref=e22] [cursor=pointer]:
          - /url: /heads
          - img [ref=e23]
          - generic [ref=e28]: Heads
        - link "Leads" [ref=e29] [cursor=pointer]:
          - /url: /leads
          - img [ref=e30]
          - generic [ref=e33]: Leads
        - generic [ref=e34]:
          - button "Bookings" [ref=e35]:
            - generic [ref=e36]:
              - img [ref=e37]
              - generic [ref=e39]: Bookings
            - img [ref=e40]
          - generic [ref=e42]:
            - link "Flight Tickets" [ref=e43] [cursor=pointer]:
              - /url: /bookings/flights
              - img [ref=e44]
              - generic [ref=e46]: Flight Tickets
            - link "Hotel Bookings" [ref=e47] [cursor=pointer]:
              - /url: /bookings/hotels
              - img [ref=e48]
              - generic [ref=e51]: Hotel Bookings
            - link "Visa Services" [ref=e52] [cursor=pointer]:
              - /url: /bookings/visas
              - img [ref=e53]
              - generic [ref=e56]: Visa Services
            - link "VFS Appointments" [ref=e57] [cursor=pointer]:
              - /url: /bookings/vfs
              - img [ref=e58]
              - generic [ref=e60]: VFS Appointments
            - link "Holiday Packages" [ref=e61] [cursor=pointer]:
              - /url: /bookings/holidays
              - img [ref=e62]
              - generic [ref=e65]: Holiday Packages
            - link "Transportation" [ref=e66] [cursor=pointer]:
              - /url: /bookings/transport
              - img [ref=e67]
              - generic [ref=e71]: Transportation
            - link "Other Services" [ref=e72] [cursor=pointer]:
              - /url: /bookings/other-services
              - img [ref=e73]
              - generic [ref=e76]: Other Services
        - link "Cash Management" [ref=e77] [cursor=pointer]:
          - /url: /cash-management
          - img [ref=e78]
          - generic [ref=e82]: Cash Management
        - link "Performance" [ref=e83] [cursor=pointer]:
          - /url: /performance
          - img [ref=e84]
          - generic [ref=e87]: Performance
    - generic [ref=e89]:
      - generic [ref=e90]:
        - generic [ref=e91]: JS
        - generic [ref=e92]:
          - generic [ref=e93]: John Salesman
          - generic [ref=e94]: Sales Executive
      - button [ref=e95]:
        - img
    - generic [ref=e96]:
      - generic [ref=e97]:
        - img [ref=e98]
        - generic [ref=e100]: Dev Identity
        - generic [ref=e101]: DEV
      - combobox "Switch development identity" [ref=e102] [cursor=pointer]:
        - option "Salesman A — John (Dev ID 1)" [selected]
        - option "Salesman B — Sarah (Dev ID 2)"
        - option "No Permission — Guest (Dev ID 3)"
      - paragraph [ref=e103]: Switching reloads the page. Identity persists via localStorage.
  - generic [ref=e104]:
    - banner [ref=e105]:
      - navigation "breadcrumb" [ref=e108]:
        - list [ref=e109]:
          - listitem [ref=e110]:
            - link "Home" [ref=e111] [cursor=pointer]:
              - /url: /dashboard
          - listitem [ref=e112]:
            - img [ref=e113]
          - listitem [ref=e115]:
            - link "Bookings" [ref=e116] [cursor=pointer]:
              - /url: /bookings
          - listitem [ref=e117]:
            - img [ref=e118]
          - listitem [ref=e120]:
            - link "Other Services" [disabled] [ref=e121]
      - generic [ref=e122]:
        - button [ref=e123]:
          - img
        - button [ref=e125]:
          - img
        - generic [ref=e127]:
          - generic [ref=e128]:
            - generic [ref=e129]: John Salesman
            - generic [ref=e130]: Sales Executive
          - generic [ref=e131]: JS
    - main [ref=e132]:
      - generic [ref=e133]:
        - generic [ref=e134]:
          - heading "Other Services" [level=1] [ref=e135]
          - paragraph [ref=e136]: Manage custom travel bookings, attestation fees, and insurance services.
        - generic [ref=e138]:
          - button "Create Booking" [active] [ref=e139]:
            - img
            - generic [ref=e140]: Create Booking
          - button "Reload" [ref=e141]:
            - img
            - generic [ref=e142]: Reload
      - generic [ref=e146]:
        - generic [ref=e147]:
          - generic [ref=e148]: Payment Status
          - combobox "Payment Status" [ref=e149] [cursor=pointer]:
            - option "All Payments" [selected]
            - option "Pending"
            - option "Success"
            - option "Failed"
        - generic [ref=e150]:
          - generic [ref=e151]: Booking Status
          - combobox "Booking Status" [ref=e152] [cursor=pointer]:
            - option "All Bookings" [selected]
            - option "Pending"
            - option "Confirmed"
            - option "Success"
            - option "Failed"
            - option "Cancelled"
            - option "Collection"
            - option "Collected"
      - generic [ref=e153]:
        - alert [ref=e154]:
          - img [ref=e155]
          - generic [ref=e156]: Failed to load other services
          - generic [ref=e157]: An unexpected error occurred.
        - button "Retry Fetch" [ref=e158]:
          - generic [ref=e159]: Retry Fetch
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Sales Portal Other Services E2E Tests', () => {
  4   |   test('should create a new other service booking, redirect to detail view, and verify lists', async ({ page }) => {
  5   |     // 1. Switch identity to Salesman A (John) and go to dashboard
  6   |     await page.goto('/dashboard');
  7   |     const devSelect = page.locator('select[aria-label="Switch development identity"]');
  8   |     await devSelect.selectOption('salesman-a');
  9   |     await page.waitForURL(/\/dashboard/);
  10  | 
  11  |     // 2. Go to Bookings -> Other Services page
  12  |     await page.goto('/bookings/other-services');
  13  |     await page.waitForURL(/\/bookings\/other-services/);
  14  |     await expect(page.locator('h1')).toHaveText('Other Services');
  15  | 
  16  |     // 3. Click "Create Booking"
  17  |     const createBtn = page.locator('button:has-text("Create Booking")');
  18  |     await expect(createBtn).toBeVisible();
  19  |     await createBtn.click();
> 20  |     await page.waitForURL(/\/bookings\/other-services\/new/);
      |                ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  21  |     await expect(page.locator('h1')).toHaveText('New Other Service');
  22  | 
  23  |     // 4. Fill form inputs
  24  |     // Type in customer lookup search input
  25  |     const customerSearch = page.locator('#customerHeadSearch');
  26  |     await expect(customerSearch).toBeVisible();
  27  |     await customerSearch.fill('Alice');
  28  |     
  29  |     // Select Alice from search dropdown options
  30  |     const aliceOption = page.locator('button:has-text("Alice A_Head")');
  31  |     await expect(aliceOption).toBeVisible();
  32  |     await aliceOption.click();
  33  | 
  34  |     // Verify customer selection text is showing wallet info
  35  |     await expect(page.locator('text=Alice A_Head')).toBeVisible();
  36  | 
  37  |     // Passenger / Client name
  38  |     const nameInput = page.locator('#passengerNameInput');
  39  |     await nameInput.fill('E2E Passenger Test');
  40  | 
  41  |     // Service name
  42  |     const serviceNameInput = page.locator('#serviceNameInput');
  43  |     await serviceNameInput.fill('E2E Test Attestation');
  44  | 
  45  |     // Toggle In-house service checkbox off (so external supplier options appear)
  46  |     const inhouseCheckbox = page.locator('input[type="checkbox"]');
  47  |     await expect(inhouseCheckbox).toBeChecked(); // defaults to true
  48  |     await inhouseCheckbox.click(); // toggle off
  49  | 
  50  |     // Select Supplier
  51  |     const supplierSelect = page.locator('#supplierSelect');
  52  |     await expect(supplierSelect).toBeVisible();
  53  |     await supplierSelect.selectOption('1'); // ID 1 is VFS Global
  54  | 
  55  |     // Cost inputs
  56  |     const supplierCostInput = page.locator('#supplierCostInput');
  57  |     await supplierCostInput.fill('40');
  58  | 
  59  |     const sellingPriceInput = page.locator('#payableAmountInput');
  60  |     await sellingPriceInput.fill('60');
  61  | 
  62  |     // Verify calculated profit is 20.000
  63  |     await expect(page.locator('text=Calculated Profit:')).toBeVisible();
  64  |     await expect(page.locator('text=BHD 20.000')).toBeVisible();
  65  | 
  66  |     // Payment method
  67  |     const paymentMethodSelect = page.locator('#paymentMethodSelect');
  68  |     await paymentMethodSelect.selectOption('cash');
  69  | 
  70  |     // Status
  71  |     const statusSelect = page.locator('#bookingStatusSelect');
  72  |     await statusSelect.selectOption('pending');
  73  | 
  74  |     // Save notes
  75  |     const narrationInput = page.locator('#narrationInput');
  76  |     await narrationInput.fill('E2E booking notes.');
  77  | 
  78  |     // Submit
  79  |     const submitBtn = page.locator('#submitBookingBtn');
  80  |     await submitBtn.click();
  81  | 
  82  |     // 5. Verify redirect to details page
  83  |     await page.waitForURL(/\/bookings\/other-services\/\d+/);
  84  |     await expect(page.locator('h1')).toHaveText(/Booking TXNOTH\d+/);
  85  | 
  86  |     // Verify values on details view page
  87  |     await expect(page.locator('text=E2E Test Attestation')).toBeVisible();
  88  |     await expect(page.locator('text=Mr. E2E Passenger Test')).toBeVisible(); // Prefix Mr. + Name
  89  |     await expect(page.locator('text=Alice A_Head')).toBeVisible();
  90  |     await expect(page.locator('text=VFS Global')).toBeVisible();
  91  |     await expect(page.locator('text=E2E booking notes.')).toBeVisible();
  92  |     
  93  |     // Prices
  94  |     const sellingPriceText = page.locator('text=Selling Amount').locator('..');
  95  |     await expect(sellingPriceText.locator('text=60.000 BHD')).toBeVisible();
  96  | 
  97  |     const supplierCostText = page.locator('text=Supplier Cost').locator('..');
  98  |     await expect(supplierCostText.locator('text=40.000 BHD')).toBeVisible();
  99  | 
  100 |     const grossProfitText = page.locator('text=Gross Profit').locator('..');
  101 |     await expect(grossProfitText.locator('text=20.000 BHD')).toBeVisible();
  102 | 
  103 |     // Method
  104 |     await expect(page.locator('text=Method').locator('..').locator('text=cash')).toBeVisible();
  105 | 
  106 |     // 6. Go back to list and check if new booking appears in datatable
  107 |     await page.goto('/bookings/other-services');
  108 |     await page.waitForURL(/\/bookings\/other-services/);
  109 |     await expect(page.locator('text=E2E Test Attestation')).toBeVisible();
  110 |     await expect(page.locator('text=E2E Passenger Test')).toBeVisible();
  111 |   });
  112 | });
  113 | 
```