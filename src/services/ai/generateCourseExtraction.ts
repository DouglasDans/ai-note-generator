import { transcribeAudio, type GenAIClient } from "./transcribeAudio.ts";
import { structureTranscript, type GroqClient } from "./structureTranscript.ts";
import type { Course, CourseExtractionResult } from "./types.ts";

export type { GenAIClient } from "./transcribeAudio.ts";
export type { GroqClient } from "./structureTranscript.ts";

const PROMPT_VERSION = "4.0";

export interface GenerateCourseExtractionParams {
  geminiClient: GenAIClient;
  groqClient: GroqClient;
  /** Caminho de arquivo (uso via CLI/scripts) ou Blob/File (upload web —
   * um File de FormData já é um Blob, sem precisar escrever em disco). */
  audioSource: string | Blob;
  audioMimeType: string;
  recordingDate: string;
  courseName?: string;
  professorName?: string;
}

/**
 * Pipeline em duas etapas: transcreve o áudio (Gemini, modelo dedicado de
 * transcrição) e depois estrutura a transcrição em JSON (Groq, schema
 * estrito) — dois provedores, então uma instabilidade isolada num deles não
 * derruba a extração inteira. Ver PLANO.md (decisão 4.3 revista) para o
 * porquê de sair do modelo de chamada única.
 */
export async function generateCourseExtraction(
  params: GenerateCourseExtractionParams
): Promise<CourseExtractionResult> {
  const {
    geminiClient,
    groqClient,
    audioSource,
    audioMimeType,
    recordingDate,
    courseName,
    professorName,
  } = params;

  const transcript = await transcribeAudio({
    client: geminiClient,
    audioSource,
    audioMimeType,
  });

  const extraction = await structureTranscript({
    client: groqClient,
    transcript,
    recordingDate,
    courseName,
    professorName,
  });

  const courses: Course[] = extraction.courses.map((course) => ({
    ...course,
    sessions: course.sessions.map((session) => ({
      ...session,
      recording_date: recordingDate,
      prompt_version: PROMPT_VERSION,
    })),
  }));

  return { full_transcript: transcript, courses };
}
