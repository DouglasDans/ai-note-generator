import { prisma } from "@/db/client";
import type { CourseExtractionResult } from "@/services/ai/types";
import { mapCourseExtractionToRows } from "./mapCourseExtractionToRows";

/**
 * Grava o resultado do pipeline de IA (Fase 2) como Course/Session/TaskItem/
 * MentionedDate. Uma transação por chamada — se qualquer sessão falhar,
 * nenhum curso da extração fica gravado pela metade.
 */
export async function persistCourseExtraction(
  spaceId: string,
  result: CourseExtractionResult
) {
  const rows = mapCourseExtractionToRows(result);

  return prisma.$transaction(
    rows.map((courseRow) =>
      prisma.course.create({
        data: {
          spaceId,
          name: courseRow.name,
          professor: courseRow.professor,
          sessions: {
            create: courseRow.sessions.map((session) => ({
              title: session.title,
              summary: session.summary,
              offTopic: session.offTopic,
              futureTasksOverview: session.futureTasksOverview,
              classActivities: session.classActivities,
              fullTranscript: session.fullTranscript,
              recordingDate: session.recordingDate,
              promptVersion: session.promptVersion,
              tags: session.tags,
              taskItems: { create: session.taskItems },
              mentionedDates: { create: session.mentionedDates },
            })),
          },
        },
        include: {
          sessions: { include: { taskItems: true, mentionedDates: true } },
        },
      })
    )
  );
}

export async function listCoursesBySpace(spaceId: string) {
  return prisma.course.findMany({
    where: { spaceId },
    orderBy: { createdAt: "asc" },
  });
}

// findFirst com spaceId (não findUnique só por id) para não vazar curso de
// um space para quem só tem acesso a outro (ver PLANO.md, decisão 4.1).
export async function getCourseWithSessions(courseId: string, spaceId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, spaceId },
    include: { sessions: { orderBy: { recordingDate: "asc" } } },
  });
}

export async function getSessionById(sessionId: string, courseId: string) {
  return prisma.session.findFirst({
    where: { id: sessionId, courseId },
    include: { taskItems: true, mentionedDates: true },
  });
}
