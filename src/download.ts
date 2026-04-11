const url = process.argv[2];

if (!url) {
  console.error("Uso: bun demo.ts <URL>");
  process.exit(1);
}

const fullUrl = url.startsWith("http") ? url : `https://${url}`;
const fetchUrl = new URL(fullUrl);
fetchUrl.searchParams.set("nc", Date.now().toString());
const response = await fetch(fetchUrl.toString());
const html = await response.text();

const alias = process.argv[3];
const name = alias || new URL(fullUrl).hostname.replace(/\./g, "_");
const now = new Date();
const ts = now.getFullYear().toString()
  + (now.getMonth() + 1).toString().padStart(2, "0")
  + now.getDate().toString().padStart(2, "0")
  + now.getHours().toString().padStart(2, "0")
  + now.getMinutes().toString().padStart(2, "0")
  + now.getSeconds().toString().padStart(2, "0");

await Bun.spawn(["mkdir", "-p", "tmp"]).exited;
const filename = `tmp/${name}.${ts}.html`;
await Bun.write(filename, html);
console.log(`Guardado en ${filename}`);
