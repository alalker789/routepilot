import { test, expect } from '@playwright/test';

test.describe('RoutePilot smoke test', () => {
  test('complete core Route53 workflow', async ({ page }) => {
    const zoneName = `e2e-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}.dev`;

    const recordName = `test.${zoneName}`;

    // --------------------------------------------------
    // Login
    // --------------------------------------------------
    await page.goto('/login');

    const loginInputs = page.locator('input:visible');

    await loginInputs.nth(0).fill('admin@routepilot.local');
    await loginInputs.nth(1).fill('routepilot');

    await page
      .getByRole('button', { name: /sign in|login/i })
      .click();

    await expect(page).toHaveURL(/\/zones$/);

    // --------------------------------------------------
    // Open Hosted Zones
    // --------------------------------------------------
    await page
      .getByRole('link', { name: /hosted zones/i })
      .click();

    await expect(page).toHaveURL(/\/zones$/);

    await expect(
      page.getByRole('heading', { name: /hosted zones/i })
    ).toBeVisible();

    // --------------------------------------------------
    // Create Hosted Zone
    // --------------------------------------------------
    await page
      .getByRole('button', { name: /create hosted zone/i })
      .click();

    const zoneModal = page.locator('.modal');

    await expect(zoneModal).toBeVisible();

    await zoneModal
      .locator('input')
      .first()
      .fill(zoneName);

    await zoneModal
      .locator('textarea')
      .first()
      .fill('Automated Playwright test zone');

    const createZoneResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        /\/api\/zones(?:\?.*)?$/.test(response.url()) &&
        response.ok()
    );

    await zoneModal
      .getByRole('button', {
        name: /^create hosted zone$/i,
      })
      .click();

    await createZoneResponse;

    await expect(zoneModal).toBeHidden();

    // --------------------------------------------------
    // Find Newly Created Zone
    // --------------------------------------------------
    const displayedZoneName = `${zoneName}.`;

    const zoneSearch = page.getByRole('textbox', {
      name: 'Search hosted zones',
    });

    await expect(zoneSearch).toBeVisible();

    await zoneSearch.fill(zoneName);

    await expect(
      page.getByText(displayedZoneName, {
        exact: true,
      })
    ).toBeVisible();

    // --------------------------------------------------
    // Open Zone
    // --------------------------------------------------
    await page
      .getByText(displayedZoneName, {
        exact: true,
      })
      .click();

    await expect(page).toHaveURL(/\/zones\/\d+$/);

    // --------------------------------------------------
    // Create DNS Record
    // --------------------------------------------------
    await page
      .getByRole('button', {
        name: /^create record$/i,
      })
      .click();

    const recordNameInput = page.getByRole('textbox', {
      name: /api\./i,
    });

    await expect(recordNameInput).toBeVisible();

    await recordNameInput.fill(recordName);

    await page
      .getByRole('combobox')
      .last()
      .selectOption('A');

    await page
      .getByRole('textbox', {
        name: '203.0.113.42',
      })
      .fill('203.0.113.10');

    const createRecordResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        /\/api\/zones\/\d+\/records$/.test(response.url()) &&
        response.ok()
    );

    await page
      .getByRole('button', {
        name: /^create record$/i,
      })
      .last()
      .click();

    await createRecordResponse;

    await expect(
      page.getByText(recordName, {
        exact: true,
      })
    ).toBeVisible();

    // --------------------------------------------------
    // Search Record
    // --------------------------------------------------
    const recordSearch = page.getByRole('textbox', {
      name: 'Search records',
    });

    await expect(recordSearch).toBeVisible();

    await recordSearch.fill(recordName);

    await expect(
      page.getByText(recordName, {
        exact: true,
      })
    ).toBeVisible();

    // --------------------------------------------------
    // Activity
    // --------------------------------------------------
    const activityTab = page.getByRole('button', {
      name: /^activity$/i,
    });

    if (await activityTab.count()) {
      await activityTab.click();

      // Verify rendered UI instead of waiting for
      // a specific network request.
      await expect(
        page.getByText(/create/i).first()
      ).toBeVisible({ timeout: 10000 });
    }

    // --------------------------------------------------
    // Return to Records
    // --------------------------------------------------
    const recordsTab = page.getByRole('button', {
      name: /^records$/i,
    });

    if (await recordsTab.count()) {
      await recordsTab.click();

      await expect(
        page.getByRole('textbox', {
          name: 'Search records',
        })
      ).toBeVisible();
    }

    // --------------------------------------------------
    // Dark Mode
    // --------------------------------------------------
    const themeToggle = page.locator('.themeToggle');

    if (await themeToggle.count()) {
      await themeToggle.click();

      await expect(
        page.locator('.app.dark')
      ).toBeVisible();
    }

    // --------------------------------------------------
    // Logout
    // --------------------------------------------------
    await page
      .getByRole('button', {
        name: /sign out/i,
      })
      .click();

    await expect(page).toHaveURL(/\/login/);
  });
});