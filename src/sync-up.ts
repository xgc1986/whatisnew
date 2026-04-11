import { drive, whatIsNewId } from "./drive";
import { Readable } from "stream";

const folders = ["memory", "results", "scripts"];
const zipFile = "whatisnew-backup.zip";

// Comprimir carpetas
console.log("Comprimiendo...");
const existing_dirs = folders.filter((f) => Bun.spawnSync(["test", "-d", f]).exitCode === 0);
const zip = Bun.spawn(["zip", "-r", zipFile, ...existing_dirs], { stdout: "pipe", stderr: "inherit" });
await zip.exited;

// Buscar si ya existe el fichero en Drive para actualizarlo
const existing = await drive.files.list({
  q: `'${whatIsNewId}' in parents and name = '${zipFile}' and trashed = false`,
  fields: "files(id)",
});

const fileContent = await Bun.file(zipFile).arrayBuffer();
const body = Readable.from(Buffer.from(fileContent));

if (existing.data.files?.length) {
  const fileId = existing.data.files[0].id!;
  await drive.files.update({
    fileId,
    media: { mimeType: "application/zip", body },
  });
  console.log("Actualizado en Drive.");
} else {
  await drive.files.create({
    requestBody: {
      name: zipFile,
      parents: [whatIsNewId],
    },
    media: { mimeType: "application/zip", body },
  });
  console.log("Subido a Drive.");
}

// Limpiar fichero temporal
await Bun.spawn(["rm", zipFile]).exited;
