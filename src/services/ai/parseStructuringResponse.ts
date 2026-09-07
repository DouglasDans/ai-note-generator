import type {
  CourseExtraction,
  FutureTasks,
  MentionedDate,
  SessionExtraction,
  StructuringResponse,
  TaskItem,
} from "./types.ts";

export class StructuringParseError extends Error {}

/**
 * O schema JSON estrito do Groq restringe a saída mas não é garantia
 * absoluta — a validação aqui é a última linha de defesa antes do JSON
 * entrar no resto do sistema.
 */
export function parseStructuringResponse(
  rawText: string | null | undefined
): StructuringResponse {
  if (!rawText) {
    throw new StructuringParseError("A resposta do Groq não contém texto.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (cause) {
    throw new StructuringParseError("A resposta do Groq não é um JSON válido.", {
      cause,
    });
  }

  if (!isStructuringResponse(parsed)) {
    throw new StructuringParseError(
      "A resposta do Groq não corresponde ao formato esperado (StructuringResponse)."
    );
  }

  return parsed;
}

function isStructuringResponse(value: unknown): value is StructuringResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return Array.isArray(v.courses) && v.courses.every(isCourseExtraction);
}

function isCourseExtraction(value: unknown): value is CourseExtraction {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.name === "string" &&
    typeof v.professor === "string" &&
    Array.isArray(v.sessions) &&
    v.sessions.every(isSessionExtraction)
  );
}

function isSessionExtraction(value: unknown): value is SessionExtraction {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.title === "string" &&
    typeof v.summary === "string" &&
    typeof v.off_topic === "string" &&
    typeof v.class_activities === "string" &&
    Array.isArray(v.tags) &&
    isFutureTasks(v.future_tasks) &&
    Array.isArray(v.mentioned_dates) &&
    v.mentioned_dates.every(isMentionedDate)
  );
}

function isFutureTasks(value: unknown): value is FutureTasks {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.overview === "string" &&
    Array.isArray(v.items) &&
    v.items.every(isTaskItem)
  );
}

function isTaskItem(value: unknown): value is TaskItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    isNullableIsoDate(v.due_date_iso) &&
    typeof v.due_date_original_text === "string"
  );
}

function isMentionedDate(value: unknown): value is MentionedDate {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    isNullableIsoDate(v.date_iso) &&
    typeof v.original_text === "string" &&
    typeof v.description === "string"
  );
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isNullableIsoDate(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && ISO_DATE_PATTERN.test(value));
}
