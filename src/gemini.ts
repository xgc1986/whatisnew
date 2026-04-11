const name = process.argv[2];

if (!name) {
    console.error("Uso: bun gemini.ts <NOMBRE> (ej: as_com)");
    process.exit(1);
}

const diffFile = `tmp/${name}.diff`;
const diff = await Bun.file(diffFile).text().catch(() => "");

if (!diff.trim()) {
    console.log("No hay cambios.");
    process.exit(0);
}

let output: string;

const lines = diff.split("\n").length;
if (lines > 5000) {
    output = "Cambio completo de la pagina";
} else {
    const prompt = `
      Aquí tienes un diff que muestra las diferencias entre dos capturas de la misma web en momentos distintos. No me interesan los apartados técnicos del diff, solo quiero saber qué ha cambiado en el contenido visible de esa web en formato bullet points, para saber si me interesa entrar o no en esa web para ver más. No te enrolles y sé conciso. Responde en el idioma del contenido de la web.

      ${diff}
    `;

    const proc = Bun.spawn(["gemini", "-p", prompt], {
        stdout: "pipe",
        stderr: "inherit",
    });

    output = await new Response(proc.stdout).text();
    await proc.exited;
}

console.log(output);

await Bun.spawn(["mkdir", "-p", "results"]).exited;
const resultFile = `results/${name}.result.md`;
const now = new Date();
const date = now.toLocaleString("es-ES", {dateStyle: "full", timeStyle: "short"});
const entry = `# ${date}\n\n${output.trim()}\n\n---\n\n`;

const existing = await Bun.file(resultFile).text().catch(() => "");
await Bun.write(resultFile, entry + existing);
