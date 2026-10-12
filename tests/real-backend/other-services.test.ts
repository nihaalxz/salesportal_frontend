import { test, expect } from '@playwright/test';

test.describe('Sales Portal Other Services E2E Tests', () => {
  test('should create a new other service booking, redirect to detail view, and verify lists', async ({ page }) => {
    // 1. Switch identity to Salesman A (John) and go to dashboard
    await page.goto('/dashboard');
    const devSelect = page.locator('select[aria-label="Switch development identity"]');
    await devSelect.selectOption('salesman-a');
    await page.waitForURL(/\/dashboard/);

    // 2. Go to Bookings -> Other Services page
    await page.goto('/bookings/other-services');
    await page.waitForURL(/\/bookings\/other-services/);
    await expect(page.locator('h1')).toHaveText('Other Services');

    // 3. Click "Create Booking"
    const createBtn = page.locator('button:has-text("Create Booking")');
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    await page.waitForURL(/\/bookings\/other-services\/new/);
    await expect(page.locator('h1')).toHaveText('New Other Service');

    // 4. Fill form inputs
    // Type in customer lookup search input
    const customerSearch = page.locator('#customerHeadSearch');
    await expect(customerSearch).toBeVisible();
    await customerSearch.fill('Alice');
    
    // Select Alice from search dropdown options
    const aliceOption = page.locator('button:has-text("Alice A_Head")');
    await expect(aliceOption).toBeVisible();
    await aliceOption.click();

    // Verify customer selection text is showing wallet info
    await expect(page.locator('text=Alice A_Head')).toBeVisible();

    // Passenger / Client name
    const nameInput = page.locator('#passengerNameInput');
    await nameInput.fill('E2E Passenger Test');

    // Service name
    const serviceNameInput = page.locator('#serviceNameInput');
    await serviceNameInput.fill('E2E Test Attestation');

    // Toggle In-house service checkbox off (so external supplier options appear)
    const inhouseCheckbox = page.locator('input[type="checkbox"]');
    await expect(inhouseCheckbox).toBeChecked(); // defaults to true
    await inhouseCheckbox.click(); // toggle off

    // Select Supplier
    const supplierSelect = page.locator('#supplierSelect');
    await expect(supplierSelect).toBeVisible();
    await supplierSelect.selectOption('1'); // ID 1 is VFS Global

    // Cost inputs
    const supplierCostInput = page.locator('#supplierCostInput');
    await supplierCostInput.fill('40');

    const sellingPriceInput = page.locator('#payableAmountInput');
    await sellingPriceInput.fill('60');

    // Verify calculated profit is 20.000
    await expect(page.locator('text=Calculated Profit:')).toBeVisible();
    await expect(page.locator('text=BHD 20.000')).toBeVisible();

    // Payment method
    const paymentMethodSelect = page.locator('#paymentMethodSelect');
    await paymentMethodSelect.selectOption('cash');

    // Status
    const statusSelect = page.locator('#bookingStatusSelect');
    await statusSelect.selectOption('pending');

    // Save notes
    const narrationInput = page.locator('#narrationInput');
    await narrationInput.fill('E2E booking notes.');

    // Submit
    const submitBtn = page.locator('#submitBookingBtn');
    await submitBtn.click();

    // 5. Verify redirect to details page
    await page.waitForURL(/\/bookings\/other-services\/\d+/);
    await expect(page.locator('h1')).toHaveText(/Booking TXNOTH\d+/);

    // Verify values on details view page
    await expect(page.locator('text=E2E Test Attestation')).toBeVisible();
    await expect(page.locator('text=Mr. E2E Passenger Test')).toBeVisible(); // Prefix Mr. + Name
    await expect(page.locator('text=Alice A_Head')).toBeVisible();
    await expect(page.locator('text=VFS Global')).toBeVisible();
    await expect(page.locator('text=E2E booking notes.')).toBeVisible();
    
    // Prices
    const sellingPriceText = page.locator('text=Selling Amount').locator('..');
    await expect(sellingPriceText.locator('text=60.000 BHD')).toBeVisible();

    const supplierCostText = page.locator('text=Supplier Cost').locator('..');
    await expect(supplierCostText.locator('text=40.000 BHD')).toBeVisible();

    const grossProfitText = page.locator('text=Gross Profit').locator('..');
    await expect(grossProfitText.locator('text=20.000 BHD')).toBeVisible();

    // Method
    await expect(page.locator('text=Method').locator('..').locator('text=cash')).toBeVisible();

    // 6. Go back to list and check if new booking appears in datatable
    await page.goto('/bookings/other-services');
    await page.waitForURL(/\/bookings\/other-services/);
    await expect(page.locator('text=E2E Test Attestation')).toBeVisible();
    await expect(page.locator('text=E2E Passenger Test')).toBeVisible();
  });
});
