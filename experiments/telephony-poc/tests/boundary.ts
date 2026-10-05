import { readFileSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import ts from "typescript";
export function assertPocGraph(entry: string, mode: "LOCAL_FAKE" | "LIVE", files?: Readonly<Record<string, string>>) {
  const root = resolve("experiments/telephony-poc"), visited = new Set<string>();
  function inspect(file: string) {
    file = resolve(file);
    if (!file.startsWith(root + "/")) throw new Error("PRODUCT_IMPORT");
    if (visited.has(file)) return; visited.add(file);
    if (mode === "LOCAL_FAKE" && basename(file).startsWith("live-")) throw new Error("LIVE_IMPORT_IN_FAKE");
    const source = files ? files[file] : readFileSync(file, "utf8");
    if (source === undefined) throw new Error("UNINSPECTED_IMPORT");
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const sdk = new Set<string>();
    for (const node of tree.statements) {
      if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
      const spec = node.moduleSpecifier; if (!spec || !ts.isStringLiteral(spec)) continue;
      if (spec.text.startsWith(".")) { inspect(resolve(dirname(file), spec.text) + ".ts"); continue; }
      const allowed = new Set(["zod", "pg", "twilio", "node:http", "node:crypto"]);
      if (mode === "LIVE" && basename(file) === "live-transport.ts") allowed.add("node:https");
      if (!allowed.has(spec.text)) throw new Error("FOREIGN_IMPORT");
      if (spec.text === "twilio" && ts.isImportDeclaration(node)) {
        const clause = node.importClause;
        if (clause?.name) sdk.add(clause.name.text);
        if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) sdk.add(clause.namedBindings.name.text);
        if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const binding of clause.namedBindings.elements) sdk.add(binding.name.text);
      }
    }
    let added = true;
    while (added) {
      added = false;
      function aliases(node: ts.Node) {
        if (ts.isVariableDeclaration(node) && node.initializer) {
          const base = node.initializer.getText(tree).split(".")[0]!;
          if (sdk.has(base)) {
            const names = ts.isIdentifier(node.name) ? [node.name.text] : node.name.elements.flatMap(element => ts.isBindingElement(element) ? [element.name.getText(tree)] : []);
            for (const name of names) if (!sdk.has(name)) { sdk.add(name); added = true; }
          }
        }
        ts.forEachChild(node, aliases);
      }
      aliases(tree);
    }
    function visit(node: ts.Node) {
      if (ts.isIdentifier(node) && ["fetch", "require", "eval", "Function", "WebSocket", "EventSource"].includes(node.text)) throw new Error("DYNAMIC_OR_NETWORK_CAPABILITY");
      if (ts.isIdentifier(node) && ["PrismaClient", "withTenant", "getAuth", "getDatabase", "XMLHttpRequest"].includes(node.text)) throw new Error("PRODUCT_CAPABILITY");
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const expression = node.expression.getText(tree);
        if (/^(fetch|require|eval|Function|import\b)$/.test(expression)) throw new Error("DYNAMIC_OR_NETWORK_CAPABILITY");
        const base = expression.split(".")[0]!;
        if (sdk.has(base) && !["validateRequest", "getExpectedTwilioSignature"].some(name => expression === base + "." + name)) {
          if (mode === "LOCAL_FAKE" || basename(file) !== "live-transport.ts") throw new Error("SDK_NETWORK_CONSTRUCTOR");
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
  inspect(entry); return visited;
}
