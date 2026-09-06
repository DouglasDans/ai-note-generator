import { prisma } from "@/db/client";
import { Prisma, type Space } from "@/generated/prisma/client";
import { normalizeAndValidateSlug } from "./slug";
import { generateWriteSecret } from "./secret";

export class SlugTakenError extends Error {}

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

export async function createSpace(rawSlug: string): Promise<Space> {
  const slug = normalizeAndValidateSlug(rawSlug);
  const writeSecret = generateWriteSecret();

  try {
    return await prisma.space.create({ data: { slug, writeSecret } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_CONSTRAINT_VIOLATION
    ) {
      throw new SlugTakenError(`O space "${slug}" já existe.`);
    }
    throw error;
  }
}

export async function findSpaceBySlug(slug: string): Promise<Space | null> {
  return prisma.space.findUnique({ where: { slug: slug.trim().toLowerCase() } });
}
