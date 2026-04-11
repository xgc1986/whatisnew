import { Glob, $ } from "bun";

const url = process.argv[2];

if (!url) {
  console.error("Uso: bun delete.ts <WEB>");
  process.exit(1);
}

const fullUrl = url.startsWith("http") ? url : `https://${url}`;
const name = new URL(fullUrl).hostname.replace(/\./g, "_");

const allHtml = Array.from(new Glob(`${name}.*.html`).scanSync("memory"))
  .filter((f) => !f.includes(".clean."))
  .sort();

const allClean = Array.from(new Glob(`${name}.*.clean.html`).scanSync("memory")).sort();

const toDelete: string[] = [];
if (allHtml.length > 0) toDelete.push(`memory/${allHtml.at(-1)}`);
if (allClean.length > 0) toDelete.push(`memory/${allClean.at(-1)}`);

if (toDelete.length === 0) {
  console.log("No hay ficheros que borrar.");
  process.exit(0);
}

for (const f of toDelete) {
  await $`rm ${f}`.quiet();
  console.log(`Eliminado ${f}`);
}
