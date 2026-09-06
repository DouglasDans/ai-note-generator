/**
 * Verificação manual do pipeline de ingestão contra a API real do Gemini —
 * os testes automatizados só cobrem a lógica determinística com um client
 * fake.
 *
 * Uso:
 *   GEMINI_API_KEY=... node scripts/try-generate-course-extraction.ts <caminho-audio> <data-gravacao> [mimeType]
 *
 * Exemplo:
 *   GEMINI_API_KEY=... node scripts/try-generate-course-extraction.ts ./aula.mp3 2026-03-10 audio/mp3
 */
import { createGenAIClient } from "../src/services/ai/client.ts";
import { generateCourseExtraction } from "../src/services/ai/generateCourseExtraction.ts";

async function main() {
  const [audioFilePath, recordingDate, audioMimeType = "audio/mp3"] =
    process.argv.slice(2);

  if (!audioFilePath || !recordingDate) {
    console.error(
      "Uso: node scripts/try-generate-course-extraction.ts <caminho-audio> <data-gravacao> [mimeType]"
    );
    process.exit(1);
  }

  const client = createGenAIClient();

  console.log("Gerando extração da aula...");
  const result = await generateCourseExtraction({
    client,
    audioSource: audioFilePath,
    audioMimeType,
    recordingDate,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Falhou:", error);
  process.exit(1);
});
