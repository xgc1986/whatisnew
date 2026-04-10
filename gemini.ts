const name = process.argv[2];

if (!name) {
  console.error("Uso: bun gemini.ts <NOMBRE> (ej: as_com)");
  process.exit(1);
}

const diffFile = `tmp/${name}.diff`;
const diff = await Bun.file(diffFile).text();

const prompt = `Aquí tienes un diff que muestra las diferencias entre dos capturas de la misma web en momentos distintos. No me interesan los apartados técnicos del diff, solo quiero saber qué ha cambiado en el contenido visible de esa web en formato bullet points, para saber si me interesa entrar o no en esa web para ver más. No te enrolles y sé conciso. Responde en el idioma del contenido de la web.

${diff}`;

const proc = Bun.spawn(["gemini", "-p", prompt], {
  stdout: "inherit",
  stderr: "inherit",
});

await proc.exited;
