import { google } from "googleapis";
import { createServer } from "http";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const tokenFile = "google-token.json";

if (!clientId || !clientSecret) {
  console.error("Faltan variables de entorno GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, "http://localhost:3333/callback");

const savedToken = await Bun.file(tokenFile).json().catch(() => null);

if (savedToken) {
  oauth2.setCredentials(savedToken);
} else {
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive"],
  });

  console.log("Abre esta URL en el navegador:\n");
  console.log(authUrl);

  const code = await new Promise<string>((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url!, "http://localhost:3333");
      const code = url.searchParams.get("code");
      if (code) {
        res.end("Autenticación completada. Puedes cerrar esta pestaña.");
        server.close();
        resolve(code);
      }
    });
    server.listen(3333);
  });

  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  await Bun.write(tokenFile, JSON.stringify(tokens, null, 2));
  console.log("\nToken guardado.\n");
}

export const drive = google.drive({ version: "v3", auth: oauth2 });

export async function findFolder(parentId: string, name: string): Promise<string> {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
  });
  const id = res.data.files?.[0]?.id;
  if (!id) {
    console.error(`Carpeta "${name}" no encontrada`);
    process.exit(1);
  }
  return id;
}

const codeId = await findFolder("root", "Code");
export const whatIsNewId = await findFolder(codeId, "WhatIsNew");
