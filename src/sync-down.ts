import { drive, whatIsNewId } from "./drive";

const zipFile = "whatisnew-backup.zip";

// Buscar el fichero en Drive
const res = await drive.files.list({
  q: `'${whatIsNewId}' in parents and name = '${zipFile}' and trashed = false`,
  fields: "files(id)",
});

const fileId = res.data.files?.[0]?.id;
if (!fileId) {
  console.error("No se encontró el backup en Drive.");
  process.exit(1);
}

// Descargar
console.log("Descargando...");
const response = await drive.files.get(
  { fileId, alt: "media" },
  { responseType: "arraybuffer" },
);

await Bun.write(zipFile, response.data as ArrayBuffer);

// Descomprimir
console.log("Descomprimiendo...");
const unzip = Bun.spawn(["unzip", "-o", zipFile], { stdout: "pipe", stderr: "inherit" });
await unzip.exited;

// Limpiar
await Bun.spawn(["rm", zipFile]).exited;
console.log("Restaurado.");
