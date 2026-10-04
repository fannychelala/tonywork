import { test, expect } from "@playwright/test";
import { actor, organization, identity, migration, screens } from "./fixtures/shell";
test.beforeEach(async () => { await identity.query("DELETE FROM auth_rate_limit"); });
test.afterAll(async () => { await identity.end(); await migration.end(); });
test("shell keyboard, modal, drawer, touch targets, forms and visual states", async ({ page, context }, info) => {
 await actor(context.request); const id = await organization(context.request, "Atelier de démonstration");
 for (const screen of screens) {
  await page.goto(`/app/${id}/${screen}`); await expect(page.getByTestId("organization-name")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath(`${screen}.png`), fullPage: true });
 }
 const about = page.getByRole("button", { name: "À propos de cet espace" }); await about.focus(); await page.keyboard.press("Enter");
 const modal = page.getByRole("dialog", { name: "Les écrans se construisent" }); await expect(modal).toBeVisible();
 const close = modal.getByRole("button", { name: "Fermer" }); await expect(close).toBeFocused();
 await page.keyboard.press("Tab"); await expect(close).toBeFocused(); await page.keyboard.press("Escape"); await expect(modal).not.toBeVisible(); await expect(about).toBeFocused();
 const demo = page.getByRole("button", { name: "Voir un exemple de formulaire" }); await demo.click();
 const form = page.getByRole("dialog", { name: "Exemple de formulaire" }); await form.getByRole("button", { name: "Vérifier l’exemple" }).click();
 await expect(form.getByRole("alert")).toHaveText("Saisissez un intitulé de 2 à 40 caractères.");
 const field = form.getByLabel("Intitulé de démonstration"); await expect(field).toHaveAttribute("aria-invalid", "true");
 await field.fill("Exemple fictif"); await form.getByRole("button", { name: "Vérifier l’exemple" }).click(); await expect(form.getByRole("status")).toContainText("Aucune donnée n’a été enregistrée");
 await page.keyboard.press("Escape"); await expect(demo).toBeFocused();
 await page.setViewportSize({ width: 320, height: 720 });
 const menu = page.getByRole("button", { name: "Ouvrir le menu" }); await menu.focus(); await page.keyboard.press("Enter");
 const drawer = page.getByRole("dialog", { name: "Navigation principale" }); await expect(drawer).toBeVisible();
 await expect(drawer.getByRole("button", { name: "Fermer" })).toBeFocused();
 await page.keyboard.press("Shift+Tab"); await expect(drawer.getByRole("link", { name: "Paramètres" })).toBeFocused();
 for (const element of await drawer.locator("a,button").all()) { const box = await element.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44); }
 await page.screenshot({ path: info.outputPath("drawer-320.png"), fullPage: true }); await page.keyboard.press("Escape"); await expect(menu).toBeFocused();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.screenshot({ path: info.outputPath("settings-320.png"), fullPage: true });
 await page.route(`**/api/shell/${id}`, async route => { await new Promise(resolve => setTimeout(resolve, 700)); await route.fulfill({ status: 503, body: "{}", headers: { "content-type": "application/json" } }); });
 await page.reload(); await expect(page.getByRole("status", { name: "Chargement" })).toBeVisible(); await page.screenshot({ path: info.outputPath("loading.png"), fullPage: true });
 await expect(page.getByTestId("access-error")).toBeVisible(); await expect(page.getByTestId("organization-name")).toHaveCount(0); await page.screenshot({ path: info.outputPath("error.png"), fullPage: true });
 await page.unroute(`**/api/shell/${id}`); await page.getByRole("button", { name: "Réessayer" }).click(); await expect(page.getByTestId("organization-name")).toBeVisible();
});
