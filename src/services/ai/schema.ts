import { Type, type Schema } from "@google/genai";

const nullableIsoDate: Schema = {
  type: Type.STRING,
  nullable: true,
  description:
    "Data no formato YYYY-MM-DD, resolvida a partir da data de referência da " +
    "gravação. Use null quando não for possível determinar uma data de " +
    "calendário real.",
};

const taskItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    due_date_iso: nullableIsoDate,
    due_date_original_text: {
      type: Type.STRING,
      description:
        'O texto original dito em aula sobre o prazo (ex.: "semana que vem", ' +
        '"antes da prova final"). Use "Não mencionado" se não houver menção.',
    },
  },
  required: [
    "title",
    "description",
    "due_date_iso",
    "due_date_original_text",
  ],
};

const futureTasksSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overview: { type: Type.STRING },
    items: { type: Type.ARRAY, items: taskItemSchema },
  },
  required: ["overview", "items"],
};

const mentionedDateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    date_iso: nullableIsoDate,
    original_text: { type: Type.STRING },
    description: { type: Type.STRING },
  },
  required: ["date_iso", "original_text", "description"],
};

const sessionExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    off_topic: { type: Type.STRING },
    future_tasks: futureTasksSchema,
    mentioned_dates: { type: Type.ARRAY, items: mentionedDateSchema },
    class_activities: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
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
};

const courseExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    professor: { type: Type.STRING },
    sessions: { type: Type.ARRAY, items: sessionExtractionSchema },
  },
  required: ["name", "professor", "sessions"],
};

export const COURSE_EXTRACTION_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    full_transcript: {
      type: Type.STRING,
      description:
        "Transcrição completa e fiel do áudio, sem cortes. Permite " +
        "reprocessar a aula no futuro sem precisar do áudio original de novo.",
    },
    courses: { type: Type.ARRAY, items: courseExtractionSchema },
  },
  required: ["full_transcript", "courses"],
};
