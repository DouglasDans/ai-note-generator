import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/db/client";
import { createSpace, findSpaceBySlug, SlugTakenError } from "./space.repository";
import { InvalidSlugError } from "./slug";

// Testes de integração contra o Postgres local (docker compose up -d) — ao
// contrário do pipeline de IA, uma query Postgres é determinística: um typo
// no nome de um campo é bug real e vale a pena pegar aqui, não só com fake.
beforeEach(async () => {
  await prisma.space.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("createSpace", () => {
  it("creates a space with a normalized slug and a generated write secret", async () => {
    const space = await createSpace("  Fatec-Gestao-2026  ");

    expect(space.slug).toBe("fatec-gestao-2026");
    expect(space.writeSecret).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("rejects an invalid slug before touching the database", async () => {
    await expect(createSpace("api")).rejects.toThrow(InvalidSlugError);

    expect(await prisma.space.count()).toBe(0);
  });

  it("throws SlugTakenError when the slug already exists", async () => {
    await createSpace("fatec-gestao-2026");

    await expect(createSpace("fatec-gestao-2026")).rejects.toThrow(
      SlugTakenError
    );
  });
});

describe("findSpaceBySlug", () => {
  it("finds an existing space case-insensitively", async () => {
    await createSpace("fatec-gestao-2026");

    const found = await findSpaceBySlug("FATEC-GESTAO-2026");

    expect(found?.slug).toBe("fatec-gestao-2026");
  });

  it("returns null when no space matches", async () => {
    expect(await findSpaceBySlug("nao-existe")).toBeNull();
  });
});
