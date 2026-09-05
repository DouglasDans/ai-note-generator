import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  createPartFromUri,
  createUserContent,
  type ContentListUnion,
} from "@google/genai";
import type { Disciplinas } from "@/types/JsonResponse";
import { AULA_RESPONSE_SCHEMA } from "./schema.ts";
import { buildSystemInstruction } from "./prompt.ts";
import { parseAulaSummaryResponse } from "./parseAulaSummaryResponse.ts";

const GEMINI_MODEL = "gemini-3.8-flash";
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
      file: string;
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

export interface GenerateAulaSummaryParams {
  client: GenAIClient;
  audioFilePath: string;
  audioMimeType: string;
  recordingDate: string;
  disciplinaNome?: string;
  professorNome?: string;
}

export async function generateAulaSummary(
  params: GenerateAulaSummaryParams
): Promise<Disciplinas> {
  const {
    client,
    audioFilePath,
    audioMimeType,
    recordingDate,
    disciplinaNome,
    professorNome,
  } = params;

  const promptTemplate = await readFile(PROMPT_TEMPLATE_PATH, "utf-8");
  const systemInstruction = buildSystemInstruction(promptTemplate, {
    recordingDate,
  });

  const uploadedFile = await client.files.upload({
    file: audioFilePath,
    config: { mimeType: audioMimeType },
  });

  if (!uploadedFile.uri || !uploadedFile.mimeType) {
    throw new Error(
      "Upload do áudio não retornou URI ou mimeType — resposta inesperada do Gemini."
    );
  }

  const hintParts = [`A aula foi gravada em ${recordingDate}.`];
  if (disciplinaNome) hintParts.push(`Disciplina informada: ${disciplinaNome}.`);
  if (professorNome) hintParts.push(`Professor informado: ${professorNome}.`);

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: createUserContent([
      createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
      hintParts.join(" "),
    ]),
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: AULA_RESPONSE_SCHEMA,
    },
  });

  return parseAulaSummaryResponse(response.text);
}
