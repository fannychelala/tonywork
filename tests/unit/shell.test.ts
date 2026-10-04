import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { shellDictionaries } from "../../src/shared/i18n/shell";
import { Button, Field, Skeleton } from "../../src/shared/ui/primitives";
import { isScreen, screens } from "../../src/modules/shell/screens";
it("shell screens and dictionaries have identical complete keys", () => {
 expect(Object.keys(shellDictionaries["en-GB"]).sort()).toEqual(Object.keys(shellDictionaries["fr-FR"]).sort());
 for (const screen of screens) expect(isScreen(screen)).toBe(true);
 expect(isScreen("billing")).toBe(false);
 for (const messages of Object.values(shellDictionaries)) for (const value of Object.values(messages)) expect(value.length).toBeGreaterThan(0);
});
it("primitives expose input errors, button type and loading status", () => {
 expect(renderToStaticMarkup(Button({ children: "Test" }))).toContain('type="button"');
 const field = renderToStaticMarkup(Field({ id: "name", label: "Name", error: "Invalid" }));
 expect(field).toContain('for="name"'); expect(field).toContain('aria-describedby="name-error"'); expect(field).toContain('aria-invalid="true"');
 expect(renderToStaticMarkup(Skeleton({ label: "Loading" }))).toContain('role="status"');
});
