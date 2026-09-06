import { describe, expect, it } from "vitest";
import { formatDateOnly } from "@/lib/formatDate";

describe("formatDateOnly", () => {
  it("formats a UTC-midnight date without shifting to the local timezone", () => {
    // Reproduz o bug real: sem timeZone: "UTC", isso vira "26/03/2026" em
    // qualquer ambiente rodando num fuso atrás de UTC (ex.: America/Sao_Paulo).
    expect(formatDateOnly(new Date("2026-03-27"))).toBe("27/03/2026");
  });

  it("does not shift a date near the year boundary", () => {
    expect(formatDateOnly(new Date("2026-01-01"))).toBe("01/01/2026");
  });
});
