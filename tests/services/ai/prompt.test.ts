import { describe, expect, it } from "vitest";
import { buildSystemInstruction } from "@/services/ai/prompt";

describe("buildSystemInstruction", () => {
  it("replaces the date placeholder with a sentence anchoring the recording date", () => {
    const template = "Instruções.\n{{DATA_REFERENCIA}}\nResto do prompt.";

    const result = buildSystemInstruction(template, {
      recordingDate: "2026-03-10",
    });

    expect(result).not.toContain("{{DATA_REFERENCIA}}");
    expect(result).toContain("2026-03-10");
    expect(result).toContain("daqui a duas semanas");
  });

  it("throws when the template is missing the placeholder", () => {
    const template = "Prompt sem âncora temporal nenhuma.";

    expect(() =>
      buildSystemInstruction(template, { recordingDate: "2026-03-10" })
    ).toThrow(/placeholder/i);
  });
});
