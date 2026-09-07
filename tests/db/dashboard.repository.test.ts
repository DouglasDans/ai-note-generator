import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/db/client";
import { createSpace } from "@/db/space.repository";
import { persistCourseExtraction } from "@/db/course.repository";
import {
  listRecentSessionsBySpace,
  listUpcomingItemsBySpace,
} from "@/db/dashboard.repository";
import type { CourseExtractionResult } from "@/services/ai/types";

beforeEach(async () => {
  await prisma.space.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

function extraction(options: {
  courseName?: string;
  sessionTitle: string;
  recordingDate: string;
  taskDueDateIso?: string | null;
  mentionedDateIso?: string | null;
}): CourseExtractionResult {
  return {
    full_transcript: "Transcrição completa da aula.",
    courses: [
      {
        name: options.courseName ?? "Banco de Dados",
        professor: "Fulano",
        sessions: [
          {
            title: options.sessionTitle,
            summary: "Resumo",
            off_topic: "",
            future_tasks: {
              overview: "overview",
              items: [
                {
                  title: "Prova",
                  description: "descrição da prova",
                  due_date_iso: options.taskDueDateIso ?? null,
                  due_date_original_text: "texto original",
                },
              ],
            },
            mentioned_dates: [
              {
                date_iso: options.mentionedDateIso ?? null,
                original_text: "texto original",
                description: "Entrega do projeto",
              },
            ],
            class_activities: "",
            tags: [],
            recording_date: options.recordingDate,
            prompt_version: "3.0",
          },
        ],
      },
    ],
  };
}

describe("listUpcomingItemsBySpace", () => {
  it("inclui apenas itens com data ISO igual ou posterior a agora, ordenados por data", async () => {
    const space = await createSpace("fatec-gestao-2026");
    const now = new Date("2026-06-01");

    await persistCourseExtraction(
      space.id,
      extraction({
        sessionTitle: "Aula 1",
        recordingDate: "2026-05-01",
        taskDueDateIso: "2026-06-10",
        mentionedDateIso: "2026-06-05",
      })
    );

    const items = await listUpcomingItemsBySpace(space.id, now);

    expect(items.map((i) => i.dateIso.toISOString().slice(0, 10))).toEqual([
      "2026-06-05",
      "2026-06-10",
    ]);
  });

  it("exclui itens sem data ISO (não dá pra saber se são futuros)", async () => {
    const space = await createSpace("fatec-gestao-2026");

    await persistCourseExtraction(
      space.id,
      extraction({
        sessionTitle: "Aula 1",
        recordingDate: "2026-05-01",
        taskDueDateIso: null,
        mentionedDateIso: null,
      })
    );

    const items = await listUpcomingItemsBySpace(space.id, new Date("2026-06-01"));

    expect(items).toHaveLength(0);
  });

  it("exclui itens com data ISO já passada", async () => {
    const space = await createSpace("fatec-gestao-2026");

    await persistCourseExtraction(
      space.id,
      extraction({
        sessionTitle: "Aula 1",
        recordingDate: "2026-05-01",
        taskDueDateIso: "2026-05-15",
        mentionedDateIso: "2026-05-20",
      })
    );

    const items = await listUpcomingItemsBySpace(space.id, new Date("2026-06-01"));

    expect(items).toHaveLength(0);
  });

  it("trata data igual a agora como ainda futura (inclusiva)", async () => {
    const space = await createSpace("fatec-gestao-2026");
    const now = new Date("2026-06-01");

    await persistCourseExtraction(
      space.id,
      extraction({
        sessionTitle: "Aula 1",
        recordingDate: "2026-05-01",
        taskDueDateIso: "2026-06-01",
        mentionedDateIso: null,
      })
    );

    const items = await listUpcomingItemsBySpace(space.id, now);

    expect(items).toHaveLength(1);
  });

  it("combina itens de vários cursos do mesmo space", async () => {
    const space = await createSpace("fatec-gestao-2026");
    const now = new Date("2026-06-01");

    await persistCourseExtraction(
      space.id,
      extraction({
        courseName: "Banco de Dados",
        sessionTitle: "Aula 1",
        recordingDate: "2026-05-01",
        taskDueDateIso: "2026-06-20",
        mentionedDateIso: null,
      })
    );
    await persistCourseExtraction(
      space.id,
      extraction({
        courseName: "Redes",
        sessionTitle: "Aula 1",
        recordingDate: "2026-05-01",
        taskDueDateIso: "2026-06-10",
        mentionedDateIso: null,
      })
    );

    const items = await listUpcomingItemsBySpace(space.id, now);

    expect(items.map((i) => i.courseName)).toEqual(["Redes", "Banco de Dados"]);
  });

  it("não vaza itens de outro space", async () => {
    const spaceA = await createSpace("space-a");
    const spaceB = await createSpace("space-b");
    const now = new Date("2026-06-01");

    await persistCourseExtraction(
      spaceA.id,
      extraction({
        sessionTitle: "Aula 1",
        recordingDate: "2026-05-01",
        taskDueDateIso: "2026-06-10",
        mentionedDateIso: null,
      })
    );

    const items = await listUpcomingItemsBySpace(spaceB.id, now);

    expect(items).toHaveLength(0);
  });
});

describe("listRecentSessionsBySpace", () => {
  it("retorna as sessions mais recentes do space, mais nova primeiro", async () => {
    const space = await createSpace("fatec-gestao-2026");

    await persistCourseExtraction(
      space.id,
      extraction({ sessionTitle: "Aula antiga", recordingDate: "2026-01-01" })
    );
    await persistCourseExtraction(
      space.id,
      extraction({ sessionTitle: "Aula nova", recordingDate: "2026-05-01" })
    );

    const sessions = await listRecentSessionsBySpace(space.id);

    expect(sessions.map((s) => s.title)).toEqual(["Aula nova", "Aula antiga"]);
  });

  it("limita ao número pedido", async () => {
    const space = await createSpace("fatec-gestao-2026");

    for (let i = 1; i <= 3; i++) {
      await persistCourseExtraction(
        space.id,
        extraction({ sessionTitle: `Aula ${i}`, recordingDate: `2026-0${i}-01` })
      );
    }

    const sessions = await listRecentSessionsBySpace(space.id, 2);

    expect(sessions).toHaveLength(2);
  });

  it("não vaza sessions de outro space", async () => {
    const spaceA = await createSpace("space-a");
    const spaceB = await createSpace("space-b");

    await persistCourseExtraction(
      spaceA.id,
      extraction({ sessionTitle: "Aula 1", recordingDate: "2026-05-01" })
    );

    const sessions = await listRecentSessionsBySpace(spaceB.id);

    expect(sessions).toHaveLength(0);
  });
});
