import { expect, test } from "@playwright/test";

test("renders results from tax query param", async ({ page }) => {
  await page.goto("/?tax=100000");

  await expect(page.getByRole("heading", { name: "Where did my tax go?" })).toBeVisible();
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.locator("#total-tax")).toHaveText("Rs 1,00,000.00");
  await expect(page.locator("#legend-list li").first()).toContainText("State share of taxes and duties");
  await expect(page.locator("#legend-list li").first()).toContainText("Rs 22,000.00");
});

test("shows and hides ministry detail", async ({ page }) => {
  await page.goto("/?tax=100000");

  const toggle = page.getByRole("button", { name: "Show detail" });
  await expect(toggle).toBeVisible();
  await expect(page.locator("#detail-panel")).toHaveClass(/is-collapsed/);

  await toggle.click();

  await expect(page.locator("#detail-panel")).not.toHaveClass(/is-collapsed/);
  await expect(page.locator("#ministry-list .ministry-row").first()).toContainText("State share of taxes and duties");
});

test("supports category mode and snapshot query params", async ({ page }) => {
  await page.goto("/?tax=100000&type=gst-estimate&snapshot=1");

  await expect(page.getByRole("tab", { name: "GST Estimate" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("body")).toHaveClass(/snapshot-mode/);
});
