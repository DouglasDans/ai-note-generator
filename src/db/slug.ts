import { isReservedSlug } from "./reservedSlugs";

export class InvalidSlugError extends Error {}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 63;

/**
 * Normaliza e valida um slug de space. O slug é a URL pública do space
 * (modelo Dontpad) — precisa ser seguro para path, curto o bastante para
 * digitar/compartilhar, e não colidir com rotas reais do Next.js.
 */
export function normalizeAndValidateSlug(rawSlug: string): string {
  const slug = rawSlug.trim().toLowerCase();

  if (slug.length < MIN_LENGTH || slug.length > MAX_LENGTH) {
    throw new InvalidSlugError(
      `O slug deve ter entre ${MIN_LENGTH} e ${MAX_LENGTH} caracteres.`
    );
  }

  if (!SLUG_PATTERN.test(slug)) {
    throw new InvalidSlugError(
      "O slug deve conter apenas letras minúsculas, números e hífens, sem começar ou terminar com hífen."
    );
  }

  if (isReservedSlug(slug)) {
    throw new InvalidSlugError(`"${slug}" é um nome reservado.`);
  }

  return slug;
}
