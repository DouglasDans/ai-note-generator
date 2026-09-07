/**
 * Schema JSON puro (não o builder `Type` do @google/genai) porque essa
 * etapa roda no Groq, via `response_format: { type: "json_schema" }`
 * (formato JSON Schema padrão, confirmado na doc oficial do Groq).
 *
 * Sem `full_transcript`: a transcrição já vem pronta da etapa anterior
 * (transcribeAudio), não precisa pedir pro modelo reproduzir um texto
 * longo palavra por palavra na saída — arriscado e desnecessário.
 */

const nullableIsoDate = {
  type: ["string", "null"] as const,
  description:
    "Data no formato YYYY-MM-DD, resolvida a partir da data de referência da " +
    "gravação. Use null quando não for possível determinar uma data de " +
    "calendário real.",
};

const taskItemSchema = {
  type: "object" as const,
  properties: {
    title: { type: "string" as const },
    description: { type: "string" as const },
    due_date_iso: nullableIsoDate,
    due_date_original_text: {
      type: "string" as const,
      description:
        'O texto original dito em aula sobre o prazo (ex.: "semana que vem", ' +
        '"antes da prova final"). Use "Não mencionado" se não houver menção.',
    },
  },
  required: ["title", "description", "due_date_iso", "due_date_original_text"],
  additionalProperties: false,
};

const futureTasksSchema = {
  type: "object" as const,
  properties: {
    overview: { type: "string" as const },
    items: { type: "array" as const, items: taskItemSchema },
  },
  required: ["overview", "items"],
  additionalProperties: false,
};

const mentionedDateSchema = {
  type: "object" as const,
  properties: {
    date_iso: nullableIsoDate,
    original_text: { type: "string" as const },
    description: { type: "string" as const },
  },
  required: ["date_iso", "original_text", "description"],
  additionalProperties: false,
};

const sessionExtractionSchema = {
  type: "object" as const,
  properties: {
    title: { type: "string" as const },
    summary: { type: "string" as const },
    off_topic: { type: "string" as const },
    future_tasks: futureTasksSchema,
    mentioned_dates: { type: "array" as const, items: mentionedDateSchema },
    class_activities: { type: "string" as const },
    tags: { type: "array" as const, items: { type: "string" as const } },
  },
  required: [
    "title",
    "summary",
    "off_topic",
    "future_tasks",
    "mentioned_dates",
    "class_activities",
    "tags",
  ],
  additionalProperties: false,
};

const courseExtractionSchema = {
  type: "object" as const,
  properties: {
    name: { type: "string" as const },
    professor: { type: "string" as const },
    sessions: { type: "array" as const, items: sessionExtractionSchema },
  },
  required: ["name", "professor", "sessions"],
  additionalProperties: false,
};

export const STRUCTURING_RESPONSE_SCHEMA = {
  type: "object" as const,
  properties: {
    courses: { type: "array" as const, items: courseExtractionSchema },
  },
  required: ["courses"],
  additionalProperties: false,
};
