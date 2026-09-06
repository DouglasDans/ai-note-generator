import { describe, expect, it } from "vitest";
import { InvalidSlugError, normalizeAndValidateSlug } from "@/db/slug";

describe("normalizeAndValidateSlug", () => {
  it("lowercases and trims a valid slug", () => {
    expect(normalizeAndValidateSlug("  Fatec-Gestao-2026  ")).toBe(
      "fatec-gestao-2026"
    );
  });

  it("accepts a minimal valid slug", () => {
    expect(normalizeAndValidateSlug("abc")).toBe("abc");
  });

  it.each(["ab", ""])("rejects a slug shorter than the minimum (%s)", (slug) => {
    expect(() => normalizeAndValidateSlug(slug)).toThrow(InvalidSlugError);
  });

  it("rejects a slug longer than the maximum", () => {
    expect(() => normalizeAndValidateSlug("a".repeat(64))).toThrow(
      InvalidSlugError
    );
  });

  it.each([
    "tem espaço",
    "tem_underscore",
    "-comeca-com-hifen",
    "termina-com-hifen-",
    "tem--hifen-duplo",
    "acentuação",
  ])("rejects a malformed slug (%s)", (slug) => {
    expect(() => normalizeAndValidateSlug(slug)).toThrow(InvalidSlugError);
  });

  it("rejects a reserved slug", () => {
    expect(() => normalizeAndValidateSlug("api")).toThrow(InvalidSlugError);
    expect(() => normalizeAndValidateSlug("ADMIN")).toThrow(InvalidSlugError);
  });
});
