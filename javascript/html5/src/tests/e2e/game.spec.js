import { expect, test } from "@playwright/test";

test.describe("Mahjong Solitaire app shell", () => {
	test("loads game view by default", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/Mahjong Solitaire/i);
		await expect(page.locator("#view-game")).toBeVisible();
		await expect(page.locator("#app-header-title")).toHaveText(
			"Mahjong Solitaire",
		);
		await expect(page.locator("#board svg")).toBeVisible();
	});

	test("menu navigation switches views", async ({ page }) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-rules").click();
		await expect(page.locator("#view-rules")).toBeVisible();

		await page.locator("#btn-menu").click();
		await page.locator("#nav-about").click();
		await expect(page.locator("#view-about")).toBeVisible();

		await page.locator("#view-about .btn-back").click();
		await expect(page.locator("#view-game")).toBeVisible();
	});
});

test.describe("Options and settings", () => {
	test("can switch to heart layout and ink theme", async ({ page }) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		await page.locator('input[name="layout"][value="Heart"]').check();
		await page.locator('input[name="tiletheme"][value="Ink"]').check();
		await page.locator("#btn-options-ok").click();

		await expect(page.locator("#view-game")).toBeVisible();
		await expect(page.locator("#app-header-badge")).toContainText("Heart");
		await expect(page.locator("#app-header-badge")).toContainText("Ink");
		await expect(page.locator("#board svg text").first()).toContainText(
			"tiles remaining",
		);
	});

	test("supports square layout selection", async ({ page }) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		await page.locator('input[name="layout"][value="Square"]').check();
		await page.locator("#btn-options-ok").click();

		await expect(page.locator("#app-header-badge")).toContainText("Square");
	});
});

test.describe("Highscore reset confirmation", () => {
	test("today reset asks for confirmation and can be cancelled", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		page.once("dialog", async (dialog) => {
			expect(dialog.message()).toContain("Are you sure?");
			await dialog.dismiss();
		});

		await page.locator("#btn-reset-score-today").click();
		await expect(page.locator("#score-today")).toBeVisible();
	});

	test("week reset asks for confirmation and can be accepted", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		page.once("dialog", async (dialog) => {
			expect(dialog.message()).toContain("Are you sure?");
			await dialog.accept();
		});

		await page.locator("#btn-reset-score-week").click();
		await expect(page.locator("#score-week")).toBeVisible();
	});

	test("month reset asks for confirmation and can be accepted", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();

		page.once("dialog", async (dialog) => {
			expect(dialog.message()).toContain("Are you sure?");
			await dialog.accept();
		});

		await page.locator("#btn-reset-score-month").click();
		await expect(page.locator("#score-month")).toBeVisible();
	});
});
