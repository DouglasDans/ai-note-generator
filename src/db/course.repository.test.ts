import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/db/client";
import { createSpace } from "./space.repository";
import {
  getCourseWithSessions,
  getSessionById,
  listCoursesBySpace,
  persistCourseExtraction,
} from "./course.repository";
import type { CourseExtractionResult } from "@/services/ai/types";

beforeEach(async () => {
  await prisma.space.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

function validExtraction(): CourseExtractionResult {
  return {
    full_transcript: "Transcrição completa da aula.",
    courses: [
      {
        name: "Banco de Dados",
        professor: "Fulano",
        sessions: [
          {
            title: "Normalização",
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
  it("persists courses, sessions, task items and mentioned dates, all readable back", async () => {
    const space = await createSpace("fatec-gestao-2026");

    const [createdCourse] = await persistCourseExtraction(
      space.id,
      validExtraction()
    );

    expect(createdCourse.name).toBe("Banco de Dados");
    expect(createdCourse.sessions[0].taskItems[0].dueDateIso).toEqual(
      new Date("2026-04-10")
    );

    const courses = await listCoursesBySpace(space.id);
    expect(courses).toHaveLength(1);

    const courseWithSessions = await getCourseWithSessions(
      createdCourse.id,
      space.id
    );
    expect(courseWithSessions?.sessions).toHaveLength(1);

    const session = await getSessionById(
      createdCourse.sessions[0].id,
      createdCourse.id
    );
    expect(session?.taskItems).toHaveLength(1);
    expect(session?.mentionedDates).toHaveLength(1);
    expect(session?.fullTranscript).toBe("Transcrição completa da aula.");
  });

  it("does not leak a course from another space via getCourseWithSessions", async () => {
    const spaceA = await createSpace("space-a");
    const spaceB = await createSpace("space-b");

    const [courseInA] = await persistCourseExtraction(
      spaceA.id,
      validExtraction()
    );

    const result = await getCourseWithSessions(courseInA.id, spaceB.id);

    expect(result).toBeNull();
  });

  it("cascades deletion from space down to task items and mentioned dates", async () => {
    const space = await createSpace("fatec-gestao-2026");
    await persistCourseExtraction(space.id, validExtraction());

    await prisma.space.delete({ where: { id: space.id } });

    expect(await prisma.course.count()).toBe(0);
    expect(await prisma.session.count()).toBe(0);
    expect(await prisma.taskItem.count()).toBe(0);
    expect(await prisma.mentionedDate.count()).toBe(0);
  });
});
