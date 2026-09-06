import { prisma } from "@/db/client";
import type { CourseExtractionResult } from "@/services/ai/types";
import { mapCourseExtractionToRows, type SessionRow } from "./mapCourseExtractionToRows";
import { generateUniqueSlug } from "./generateUniqueSlug";

const sessionInclude = {
  include: { taskItems: true, mentionedDates: true },
} as const;

/**
 * Grava o resultado do pipeline de IA (Fase 2) como Course/Session/TaskItem/
 * MentionedDate.
 *
 * Find-or-create por nome (case-insensitive) dentro do space: registrar uma
 * nova sessão de um curso já existente deve acrescentar a sessão ao curso,
 * não duplicá-lo. O script Python antigo tinha esse comportamento (nome
 * sanitizado como ID do documento no Firestore); sem essa checagem aqui,
 * cada upload criaria um curso novo e, pior, colidiria com a constraint
 * única de (spaceId, slug) na segunda tentativa com o mesmo nome.
 */
export async function persistCourseExtraction(
  spaceId: string,
  result: CourseExtractionResult
) {
  const rows = mapCourseExtractionToRows(result);
  const persisted = [];

  for (const courseRow of rows) {
    const existingCourse = await prisma.course.findFirst({
      where: { spaceId, name: { equals: courseRow.name, mode: "insensitive" } },
    });

    const sessionsCreateData = await buildSessionsCreateData(
      courseRow.sessions,
      existingCourse?.id ?? null
    );

    if (existingCourse) {
      persisted.push(
        await prisma.course.update({
          where: { id: existingCourse.id },
          data: { sessions: { create: sessionsCreateData } },
          include: { sessions: sessionInclude },
        })
      );
    } else {
      const existingCourseSlugs = await prisma.course.findMany({
        where: { spaceId },
        select: { slug: true },
      });
      const takenSlugs = new Set(existingCourseSlugs.map((c) => c.slug));

      persisted.push(
        await prisma.course.create({
          data: {
            spaceId,
            slug: generateUniqueSlug(courseRow.name, takenSlugs, "curso"),
            name: courseRow.name,
            professor: courseRow.professor,
            sessions: { create: sessionsCreateData },
          },
          include: { sessions: sessionInclude },
        })
      );
    }
  }

  return persisted;
}

async function buildSessionsCreateData(
  sessions: SessionRow[],
  courseId: string | null
) {
  const takenSlugs = new Set<string>();

  if (courseId) {
    const existingSessionSlugs = await prisma.session.findMany({
      where: { courseId },
      select: { slug: true },
    });
    for (const { slug } of existingSessionSlugs) takenSlugs.add(slug);
  }

  return sessions.map((session) => {
    const slug = generateUniqueSlug(session.title, takenSlugs, "sessao");
    takenSlugs.add(slug);

    return {
      slug,
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
    };
  });
}

export async function listCoursesBySpace(spaceId: string) {
  return prisma.course.findMany({
    where: { spaceId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCourseBySlug(spaceId: string, courseSlug: string) {
  return prisma.course.findUnique({
    where: { spaceId_slug: { spaceId, slug: courseSlug } },
    include: { sessions: { orderBy: { recordingDate: "asc" } } },
  });
}

export async function getSessionBySlug(courseId: string, sessionSlug: string) {
  return prisma.session.findUnique({
    where: { courseId_slug: { courseId, slug: sessionSlug } },
    ...sessionInclude,
  });
}
