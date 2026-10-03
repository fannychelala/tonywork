import { test, expect } from "@playwright/test";
test("French foundation is accessible and fits the viewport", async ({ page }) => {
 await page.goto("/");
 await expect(page.locator("html")).toHaveAttribute("lang", "fr-FR");
 await expect(page.getByRole("heading", { level: 1 })).toContainText("Tony");
 await page.keyboard.press("Tab");
 await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
 await page.keyboard.press("Enter");
 await expect(page.locator("#main")).toBeFocused();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test("health endpoint is available", async ({ request }) => {
 const response = await request.get("/health"); expect(response.ok()).toBe(true); expect(await response.json()).toEqual({ status: "ok" });
});
