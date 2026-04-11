import { Glob } from "bun";

const reset = "\x1b[0m";
const bold = "\x1b[1m";
const dim = "\x1b[2m";
const green = "\x1b[32m";
const cyan = "\x1b[36m";
const red = "\x1b[31m";
const yellow = "\x1b[33m";
const magenta = "\x1b[35m";

const url = process.argv[2];

if (!url) {
  console.error(`${red}Uso: bun index.ts <URL>${reset}`);
  process.exit(1);
}

const alias = process.argv[3];
const fullUrl = url.startsWith("http") ? url : `https://${url}`;
const name = alias || new URL(fullUrl).hostname.replace(/\./g, "_");

function step(n: number, label: string) {
  console.log(`${bold}${cyan}[${n}/4]${reset} ${bold}${label}${reset}`);
}

async function run(cmd: string[]) {
  const proc = Bun.spawn(["bun", ...cmd], {
    stdout: "pipe",
    stderr: "inherit",
  });
  const code = await proc.exited;
  if (code !== 0) {
    console.error(`${red}  Error ejecutando: bun ${cmd.join(" ")}${reset}`);
    process.exit(1);
  }
}

console.log(`${bold}${magenta}--- Web Diff ---${reset} ${dim}${fullUrl}${alias ? ` (${alias})` : ""}${reset}`);

// 1. Descargar
step(1, "Descargando web");
await run(["src/download.ts", fullUrl, ...(alias ? [alias] : [])]);

// 2. Buscar el fichero descargado (el más reciente)
const allHtml = Array.from(new Glob(`${name}.*.html`).scanSync("tmp"))
  .filter((f) => !f.includes(".clean."))
  .sort();
const newFile = `tmp/${allHtml.at(-1)}`;

// 3. Limpiar
step(2, "Limpiando HTML");
await run(["src/clean.ts", newFile]);

// 4. Buscar ficheros clean para hacer diff
const allClean = Array.from(new Glob(`${name}.*.clean.html`).scanSync("tmp")).sort();

if (allClean.length < 2) {
  console.log(`${yellow}Primera captura, no hay diff todavía.${reset}`);
  console.log(`${bold}${green}--- Completado ---${reset}`);
  process.exit(0);
}

const prevClean = `tmp/${allClean.at(-2)}`;
const newClean = `tmp/${allClean.at(-1)}`;

// 5. Diff
step(3, "Generando diff");
await run(["src/diff.ts", prevClean, newClean]);

// Comprobar si hay cambios
const diffContent = await Bun.file(`tmp/${name}.diff`).text().catch(() => "");
if (!diffContent.trim()) {
  console.log(`${yellow}No hay cambios.${reset}`);
  await Bun.spawn(["rm", newFile, newClean]).exited;
  console.log(`${bold}${green}--- Completado ---${reset}`);
  process.exit(0);
}

// 6. Gemini
step(4, "Analizando cambios con Gemini");
const geminiProc = Bun.spawn(["bun", "src/gemini.ts", name], {
  stdout: "inherit",
  stderr: "inherit",
});
if ((await geminiProc.exited) !== 0) {
  console.error(`${red}Error ejecutando gemini${reset}`);
  process.exit(1);
}
console.log(`${bold}${green}--- Completado ---${reset}`);
