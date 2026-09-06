import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  createPartFromUri,
  createUserContent,
  type ContentListUnion,
} from "@google/genai";
import { COURSE_EXTRACTION_RESPONSE_SCHEMA } from "./schema.ts";
import { buildSystemInstruction } from "./prompt.ts";
import { parseCourseExtractionResponse } from "./parseCourseExtractionResponse.ts";
import type { Course, CourseExtractionResult } from "./types.ts";

const GEMINI_MODEL = "gemini-3.8-flash";
const PROMPT_VERSION = "3.0";
const PROMPT_TEMPLATE_PATH = path.join(process.cwd(), "src/prompts/prompt.md");

/**
 * Shape mínimo do client do @google/genai que esta função consome. Uma
 * interface própria (em vez de Pick<GoogleGenAI, ...>) porque as classes do
 * SDK têm campos privados — um objeto fake de teste nunca satisfaria isso
 * estruturalmente.
 */
export interface GenAIClient {
  files: {
    upload(params: {
      file: string | Blob;
      config?: { mimeType?: string };
    }): Promise<{ uri?: string; mimeType?: string }>;
  };
  models: {
    generateContent(params: {
      model: string;
      contents: ContentListUnion;
      config?: {
        systemInstruction?: string;
        responseMimeType?: string;
        responseSchema?: unknown;
      };
    }): Promise<{ text?: string }>;
  };
}

export interface GenerateCourseExtractionParams {
  client: GenAIClient;
  /** Caminho de arquivo (uso via CLI/scripts) ou Blob/File (upload web —
   * um File de FormData já é um Blob, sem precisar escrever em disco). */
  audioSource: string | Blob;
  audioMimeType: string;
  recordingDate: string;
  courseName?: string;
  professorName?: string;
}

export async function generateCourseExtraction(
  params: GenerateCourseExtractionParams
): Promise<CourseExtractionResult> {
  const {
    client,
    audioSource,
    audioMimeType,
    recordingDate,
    courseName,
    professorName,
  } = params;

  const promptTemplate = await readFile(PROMPT_TEMPLATE_PATH, "utf-8");
  const systemInstruction = buildSystemInstruction(promptTemplate, {
    recordingDate,
  });

  const uploadedFile = await client.files.upload({
    file: audioSource,
    config: { mimeType: audioMimeType },
  });

  if (!uploadedFile.uri || !uploadedFile.mimeType) {
    throw new Error(
      "Upload do áudio não retornou URI ou mimeType — resposta inesperada do Gemini."
    );
  }

  const hintParts = [`A aula foi gravada em ${recordingDate}.`];
  if (courseName) hintParts.push(`Disciplina informada: ${courseName}.`);
  if (professorName) hintParts.push(`Professor informado: ${professorName}.`);

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: createUserContent([
      createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
      hintParts.join(" "),
    ]),
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: COURSE_EXTRACTION_RESPONSE_SCHEMA,
    },
  });

  const extraction = parseCourseExtractionResponse(response.text);

  const courses: Course[] = extraction.courses.map((course) => ({
    ...course,
    sessions: course.sessions.map((session) => ({
      ...session,
      recording_date: recordingDate,
      prompt_version: PROMPT_VERSION,
    })),
  }));

  return { full_transcript: extraction.full_transcript, courses };
}
