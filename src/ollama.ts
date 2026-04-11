const file = process.argv[2];

if (!file) {
  console.error("Uso: bun ollama.ts <FICHERO_DIFF>");
  process.exit(1);
}

const diff = await Bun.file(file).text();

const response = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gemma4:26b",
    messages: [
      {
        role: "system",
        content: `Eres un asistente que analiza cambios entre dos versiones de una página web. El usuario te adjunta un fichero diff entre dos HTMLs. Tu trabajo es explicar qué ha cambiado en el CONTENIDO de la web, como si fueras un humano que compara lo que ve en la página en dos momentos distintos.

REGLAS ESTRICTAS:
- NO expliques qué es un diff, ni cómo leerlo, ni qué significan los símbolos +, -, @@, etc.
- NO menciones nada técnico: ni atributos HTML, ni clases CSS, ni IDs, ni URLs, ni estructura del DOM, ni etiquetas HTML.
- SOLO habla de lo que un usuario vería en la página: titulares, noticias, resultados deportivos, horarios, nombres, textos que han cambiado.
- Responde SIEMPRE en castellano (español de España). NUNCA respondas en inglés.
- Responde con bullet points concisos.`,
      },
      {
        role: "user",
        content: `Aquí tienes el fichero diff. Dime qué ha cambiado en el contenido visible de la web, en castellano:\n\n${diff}`,
      },
    ],
    stream: false,
    think: false,
  }),
});

const data = await response.json();
console.log(data.message.content);
