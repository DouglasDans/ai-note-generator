import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/db/client";
import { createSpace } from "@/db/space.repository";
import {
  getCourseBySlug,
  getSessionBySlug,
  listCoursesBySpace,
  persistCourseExtraction,
} from "@/db/course.repository";
import type { CourseExtractionResult } from "@/services/ai/types";

beforeEach(async () => {
  await prisma.space.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

function extractionWithSession(sessionTitle: string): CourseExtractionResult {
  return {
    full_transcript: "Transcrição completa da aula.",
    courses: [
      {
        name: "Banco de Dados",
        professor: "Fulano",
        sessions: [
          {
            title: sessionTitle,
            summary: "Resumo",
            off_topic: "",
            future_tasks: {
              overview: "Uma prova chegando",
              items: [
                {
                  title: "Prova P1",
                  description: "Sobre normalização",
                  due_date_iso: "2026-04-10",
                  due_date_original_text: "daqui a duas semanas",
                },
              ],
            },
            mentioned_dates: [
              {
                date_iso: "2026-04-10",
                original_text: "daqui a duas semanas",
                description: "Prova P1",
              },
            ],
            class_activities: "",
            tags: ["sql"],
            recording_date: "2026-03-27",
            prompt_version: "3.0",
          },
        ],
      },
    ],
  };
}

describe("persistCourseExtraction + reads", () => {
  it("persists course/session with generated slugs, readable back by slug", async () => {
    const space = await createSpace("fatec-gestao-2026");

    const [createdCourse] = await persistCourseExtraction(
      space.id,
      extractionWithSession("Normalização")
    );

    expect(createdCourse.slug).toBe("banco-de-dados");
    expect(createdCourse.sessions[0].slug).toBe("normalizacao");
    expect(createdCourse.sessions[0].taskItems[0].dueDateIso).toEqual(
      new Date("2026-04-10")
    );

    const courses = await listCoursesBySpace(space.id);
    expect(courses).toHaveLength(1);

    const courseBySlug = await getCourseBySlug(space.id, "banco-de-dados");
    expect(courseBySlug?.sessions).toHaveLength(1);

    const session = await getSessionBySlug(createdCourse.id, "normalizacao");
    expect(session?.taskItems).toHaveLength(1);
    expect(session?.mentionedDates).toHaveLength(1);
    expect(session?.fullTranscript).toBe("Transcrição completa da aula.");
  });

  it("appends a session to an existing course instead of duplicating it", async () => {
    const space = await createSpace("fatec-gestao-2026");

    const [firstCall] = await persistCourseExtraction(
      space.id,
      extractionWithSession("Normalização")
    );
    const [secondCall] = await persistCourseExtraction(
      space.id,
      extractionWithSession("Índices")
    );

    expect(secondCall.id).toBe(firstCall.id);

    const courses = await listCoursesBySpace(space.id);
    expect(courses).toHaveLength(1);

    const courseBySlug = await getCourseBySlug(space.id, "banco-de-dados");
    expect(courseBySlug?.sessions.map((s) => s.slug).sort()).toEqual([
      "indices",
      "normalizacao",
    ]);
  });

  it("suffixes the session slug when two sessions of the same course share a title", async () => {
    const space = await createSpace("fatec-gestao-2026");

    await persistCourseExtraction(space.id, extractionWithSession("Revisão"));
    // course.update com sessão nova retorna TODAS as sessões do curso via
    // include (antiga + nova), não só a recém-criada — por isso comparamos o
    // conjunto de slugs, não um índice fixo.
    const [secondCall] = await persistCourseExtraction(
      space.id,
      extractionWithSession("Revisão")
    );

    expect(secondCall.sessions.map((s) => s.slug).sort()).toEqual([
      "revisao",
      "revisao-2",
    ]);
  });

  it("does not leak a course from another space via getCourseBySlug", async () => {
    const spaceA = await createSpace("space-a");
    const spaceB = await createSpace("space-b");

    await persistCourseExtraction(spaceA.id, extractionWithSession("Normalização"));

    const result = await getCourseBySlug(spaceB.id, "banco-de-dados");

    expect(result).toBeNull();
  });

  it("cascades deletion from space down to task items and mentioned dates", async () => {
    const space = await createSpace("fatec-gestao-2026");
    await persistCourseExtraction(space.id, extractionWithSession("Normalização"));

    await prisma.space.delete({ where: { id: space.id } });

    expect(await prisma.course.count()).toBe(0);
    expect(await prisma.session.count()).toBe(0);
    expect(await prisma.taskItem.count()).toBe(0);
    expect(await prisma.mentionedDate.count()).toBe(0);
  });
});
