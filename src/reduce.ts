import { Glob, $ } from "bun";

const allFiles = Array.from(new Glob("*.html").scanSync("memory")).sort();

const groups = new Map<string, string[]>();
for (const f of allFiles) {
  const isClean = f.includes(".clean.");
  const name = f.split(".")[0];
  const key = isClean ? `${name}.clean` : name;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key)!.push(f);
}

let total = 0;
for (const [, files] of groups) {
  if (files.length <= 1) continue;
  const toDelete = files.slice(0, -1);
  for (const f of toDelete) {
    await $`rm memory/${f}`.quiet();
    console.log(`Eliminado memory/${f}`);
    total++;
  }
}

console.log(total > 0 ? `Eliminados ${total} ficheros.` : "Nada que eliminar.");
