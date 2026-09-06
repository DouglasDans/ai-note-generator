import { describe, expect, it } from "vitest";
import { mapCourseExtractionToRows } from "./mapCourseExtractionToRows";
import type { CourseExtractionResult } from "@/services/ai/types";

function validResult(): CourseExtractionResult {
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
                {
                  title: "Lista de exercícios",
                  description: "Sem prazo definido",
                  due_date_iso: null,
                  due_date_original_text: "Não mencionado",
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

describe("mapCourseExtractionToRows", () => {
  it("maps course/session/task fields and copies full_transcript into every session", () => {
    const [course] = mapCourseExtractionToRows(validResult());

    expect(course.name).toBe("Banco de Dados");
    expect(course.professor).toBe("Fulano");

    const [session] = course.sessions;
    expect(session.title).toBe("Normalização");
    expect(session.fullTranscript).toBe("Transcrição completa da aula.");
    expect(session.recordingDate).toEqual(new Date("2026-03-27"));
    expect(session.promptVersion).toBe("3.0");
    expect(session.tags).toEqual(["sql"]);
  });

  it("parses a present due_date_iso into a Date", () => {
    const [course] = mapCourseExtractionToRows(validResult());
    const [taskWithDate] = course.sessions[0].taskItems;

    expect(taskWithDate.dueDateIso).toEqual(new Date("2026-04-10"));
  });

  it("keeps a null due_date_iso as null instead of an invalid Date", () => {
    const [course] = mapCourseExtractionToRows(validResult());
    const [, taskWithoutDate] = course.sessions[0].taskItems;

    expect(taskWithoutDate.dueDateIso).toBeNull();
  });

  it("maps mentioned_dates the same way as future_tasks items", () => {
    const [course] = mapCourseExtractionToRows(validResult());
    const [mentionedDate] = course.sessions[0].mentionedDates;

    expect(mentionedDate.dateIso).toEqual(new Date("2026-04-10"));
    expect(mentionedDate.originalText).toBe("daqui a duas semanas");
  });

  it("throws when a date field is not a valid date string", () => {
    const malformed = validResult();
    malformed.courses[0].sessions[0].future_tasks.items[0].due_date_iso =
      "não é uma data";

    expect(() => mapCourseExtractionToRows(malformed)).toThrow(/data inválida/i);
  });
});
