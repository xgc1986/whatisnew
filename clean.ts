import { parse } from "node-html-parser";
import { format } from "prettier";

const file = process.argv[2];

if (!file) {
  console.error("Uso: bun clean.ts <FICHERO_HTML>");
  process.exit(1);
}

const html = await Bun.file(file).text();
const root = parse(html);

root.querySelectorAll("script").forEach((el) => el.remove());
root.querySelectorAll("style").forEach((el) => el.remove());
root.querySelectorAll("svg").forEach((el) => el.remove());
root.querySelectorAll("canvas").forEach((el) => el.remove());

const voidTags = new Set([
  "img", "br", "hr", "input", "meta", "link", "area", "base",
  "col", "embed", "source", "track", "wbr",
]);

let removed: number;
do {
  removed = 0;
  root.querySelectorAll("*").forEach((el) => {
    if (voidTags.has(el.tagName?.toLowerCase())) return;
    const hasContent = el.text.trim() !== "" || el.querySelectorAll("*").some((child) => voidTags.has(child.tagName?.toLowerCase()));
    if (!hasContent) {
      el.remove();
      removed++;
    }
  });
} while (removed > 0);

const formatted = await format(root.toString(), { parser: "html" });
const outFile = file.replace(/\.html$/, ".clean.html");
await Bun.write(outFile, formatted);
console.log(`Guardado en ${outFile}`);
