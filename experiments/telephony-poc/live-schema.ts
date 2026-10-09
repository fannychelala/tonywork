export function bindLiveMigration(template: string, account: string) {
  if (!/^AC[0-9a-f]{32}$/.test(account) || account === "AC" + "0".repeat(32) || !template.includes("__BOUND_ACCOUNT__")) throw new Error("INVALID_MIGRATION_BINDING");
  return template.replaceAll("__BOUND_ACCOUNT__", account);
}
