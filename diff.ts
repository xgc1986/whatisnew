const file1 = process.argv[2];
const file2 = process.argv[3];

if (!file1 || !file2) {
  console.error("Uso: bun diff.ts <FICHERO1> <FICHERO2>");
  process.exit(1);
}

const proc = Bun.spawn(["diff", file1, file2], {
  stdout: "pipe",
  stderr: "pipe",
});

const output = await new Response(proc.stdout).text();
const stderr = await new Response(proc.stderr).text();
await proc.exited;

if (stderr) {
  console.error(stderr);
  process.exit(1);
}

const basename = file1.split("/").pop()!.split(".")[0];
const outFile = `tmp/${basename}.diff`;
await Bun.write(outFile, output);
console.log(`Guardado en ${outFile}`);
