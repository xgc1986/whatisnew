const name = process.argv[2];

if (!name) {
  console.error("Uso: bun auto <NOMBRE>");
  process.exit(1);
}

const proc = Bun.spawn(["bash", `scripts/${name}.sh`], {
  stdout: "inherit",
  stderr: "inherit",
});

process.exit(await proc.exited);
