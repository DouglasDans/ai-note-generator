import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildSystemInstruction } from "./prompt.ts";
import { STRUCTURING_RESPONSE_SCHEMA } from "./structuringSchema.ts";
import { parseStructuringResponse } from "./parseStructuringResponse.ts";
import type { StructuringResponse } from "./types.ts";

// gpt-oss-120b: um dos modelos com suporte a strict mode no schema JSON do
// Groq (confirmado na doc oficial, não assumido) — garante que a saída bate
// com o schema por constrained decoding, não só "melhor esforço".
const GROQ_MODEL = "openai/gpt-oss-120b";
const STRUCTURING_PROMPT_PATH = path.join(
  process.cwd(),
  "src/prompts/structuring-prompt.md"
);

/**
 * Shape mínimo do client do groq-sdk que esta função consome — mesmo motivo
 * de sempre: a classe real do SDK tem campos privados que um fake de teste
 * não satisfaria estruturalmente.
 */
export interface GroqClient {
  chat: {
    completions: {
      create(params: {
        model: string;
        messages: Array<{ role: "system" | "user"; content: string }>;
        response_format?: {
          type: "json_schema";
          json_schema: {
            name: string;
            strict?: boolean | null;
            schema?: { [key: string]: unknown };
          };
        };
      }): Promise<{ choices: Array<{ message: { content: string | null } }> }>;
    };
  };
}

export interface StructureTranscriptParams {
  client: GroqClient;
  transcript: string;
  recordingDate: string;
  courseName?: string;
  professorName?: string;
}

export async function structureTranscript(
  params: StructureTranscriptParams
): Promise<StructuringResponse> {
  const { client, transcript, recordingDate, courseName, professorName } = params;

  const promptTemplate = await readFile(STRUCTURING_PROMPT_PATH, "utf-8");
  const systemInstruction = buildSystemInstruction(promptTemplate, { recordingDate });

  const hintParts = [`A aula foi gravada em ${recordingDate}.`];
  if (courseName) hintParts.push(`Disciplina informada: ${courseName}.`);
  if (professorName) hintParts.push(`Professor informado: ${professorName}.`);

  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemInstruction },
      {
        role: "user",
        content: `${hintParts.join(" ")}\n\nTranscrição da aula:\n${transcript}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "course_extraction",
        strict: true,
        schema: STRUCTURING_RESPONSE_SCHEMA,
      },
    },
  });

  return parseStructuringResponse(response.choices[0]?.message?.content);
}
