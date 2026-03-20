import { test, expect } from "@playwright/test";

// Seeded admin credentials — see backend/app/scripts/seed.py
const ADMIN_EMAIL = "admin@compass.dev";
const ADMIN_PASSWORD = "compass123";

test.describe("Smoke tests", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading")).toBeVisible();
    await expect(page.locator("input[type=email]")).toBeVisible();
    await expect(page.locator("input[type=password]")).toBeVisible();
  });

  test("admin can log in and reach dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type=email]").fill(ADMIN_EMAIL);
    await page.locator("input[type=password]").fill(ADMIN_PASSWORD);
    await page.locator("button[type=submit]").click();
    // Should redirect to dashboard after login
    await expect(page).toHaveURL(/dashboard|assessments/, { timeout: 10_000 });
  });

  test("assessments list is accessible after login", async ({ page }) => {
    // Log in first
    await page.goto("/login");
    await page.locator("input[type=email]").fill(ADMIN_EMAIL);
    await page.locator("input[type=password]").fill(ADMIN_PASSWORD);
    await page.locator("button[type=submit]").click();
    await page.waitForURL(/dashboard|assessments/, { timeout: 10_000 });

    // Navigate to assessments
    await page.goto("/assessments");
    await expect(page).toHaveURL(/assessments/);
    // Page should load without error
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("Error");
  });
});
