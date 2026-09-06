import type {
  CourseExtractionResult,
  MentionedDate,
  Session,
  TaskItem,
} from "@/services/ai/types";

export interface TaskItemRow {
  title: string;
  description: string;
  dueDateIso: Date | null;
  dueDateOriginalText: string;
}

export interface MentionedDateRow {
  dateIso: Date | null;
  originalText: string;
  description: string;
}

export interface SessionRow {
  title: string;
  summary: string;
  offTopic: string;
  futureTasksOverview: string;
  classActivities: string;
  fullTranscript: string;
  recordingDate: Date;
  promptVersion: string;
  tags: string[];
  taskItems: TaskItemRow[];
  mentionedDates: MentionedDateRow[];
}

export interface CourseRow {
  name: string;
  professor: string;
  sessions: SessionRow[];
}

/**
 * Converte o que o pipeline de IA produz (CourseExtractionResult) para o
 * shape que o Prisma grava. Pura — sem I/O — para ser testável sem banco.
 *
 * full_transcript vive na raiz do CourseExtractionResult (uma gravação, uma
 * transcrição), mas o schema guarda uma cópia em cada Session — decisão
 * deliberada de não introduzir uma entidade "recording" separada sem
 * necessidade real ainda (ver PLANO.md, Fase 3).
 */
export function mapCourseExtractionToRows(
  result: CourseExtractionResult
): CourseRow[] {
  return result.courses.map((course) => ({
    name: course.name,
    professor: course.professor,
    sessions: course.sessions.map((session) =>
      mapSession(session, result.full_transcript)
    ),
  }));
}

function mapSession(session: Session, fullTranscript: string): SessionRow {
  return {
    title: session.title,
    summary: session.summary,
    offTopic: session.off_topic,
    futureTasksOverview: session.future_tasks.overview,
    classActivities: session.class_activities,
    fullTranscript,
    recordingDate: parseIsoDate(session.recording_date),
    promptVersion: session.prompt_version,
    tags: session.tags,
    taskItems: session.future_tasks.items.map(mapTaskItem),
    mentionedDates: session.mentioned_dates.map(mapMentionedDate),
  };
}

function mapTaskItem(item: TaskItem): TaskItemRow {
  return {
    title: item.title,
    description: item.description,
    dueDateIso: parseNullableIsoDate(item.due_date_iso),
    dueDateOriginalText: item.due_date_original_text,
  };
}

function mapMentionedDate(item: MentionedDate): MentionedDateRow {
  return {
    dateIso: parseNullableIsoDate(item.date_iso),
    originalText: item.original_text,
    description: item.description,
  };
}

function parseNullableIsoDate(value: string | null): Date | null {
  return value === null ? null : parseIsoDate(value);
}

// Uma string de data pura ("2026-04-10", sem horário) é interpretada pelo
// spec do JS como UTC — não precisa de ajuste manual de timezone aqui.
function parseIsoDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Data inválida recebida do pipeline de IA: "${value}"`);
  }
  return date;
}
