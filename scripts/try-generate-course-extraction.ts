/**
 * Verificação manual do pipeline de ingestão contra a API real do Gemini
 * (transcrição) e do Groq (estruturação) — os testes automatizados só
 * cobrem a lógica determinística com clients fake.
 *
 * Uso:
 *   GEMINI_API_KEY=... GROQ_API_KEY=... node scripts/try-generate-course-extraction.ts <caminho-audio> <data-gravacao> [mimeType]
 *
 * Exemplo:
 *   GEMINI_API_KEY=... GROQ_API_KEY=... node scripts/try-generate-course-extraction.ts ./aula.mp3 2026-03-10 audio/mp3
 */
import { createGenAIClient } from "../src/services/ai/client.ts";
import { createGroqClient } from "../src/services/ai/groqClient.ts";
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

  const geminiClient = createGenAIClient();
  const groqClient = createGroqClient();

  console.log("Transcrevendo e estruturando a aula...");
  const result = await generateCourseExtraction({
    geminiClient,
    groqClient,
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
