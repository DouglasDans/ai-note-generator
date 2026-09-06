import { describe, expect, it } from "vitest";
import { generateUniqueSlug } from "@/db/generateUniqueSlug";

describe("generateUniqueSlug", () => {
  it("slugifies a plain name", () => {
    expect(generateUniqueSlug("Banco de Dados", new Set(), "curso")).toBe(
      "banco-de-dados"
    );
  });

  it("strips diacritics", () => {
    expect(generateUniqueSlug("Revisão para prova", new Set(), "sessao")).toBe(
      "revisao-para-prova"
    );
  });

  it("appends a numeric suffix on collision", () => {
    const taken = new Set(["revisao-para-prova"]);

    expect(generateUniqueSlug("Revisão para prova", taken, "sessao")).toBe(
      "revisao-para-prova-2"
    );
  });

  it("keeps incrementing the suffix past the first collision", () => {
    const taken = new Set(["revisao-para-prova", "revisao-para-prova-2"]);

    expect(generateUniqueSlug("Revisão para prova", taken, "sessao")).toBe(
      "revisao-para-prova-3"
    );
  });

  it("falls back to the given fallback when the name has no slugifiable characters", () => {
    expect(generateUniqueSlug("!!!", new Set(), "sessao")).toBe("sessao");
  });
});
