/**
 * Slugs de space que colidiriam com rotas reais do Next.js (app/api/, assets
 * do framework) ou que ficariam confusos como nome de space (admin, login).
 * Revisável — não é uma lista fechada por spec nenhuma, é julgamento de
 * produto.
 */
export const RESERVED_SLUGS = new Set([
  "api",
  "app",
  "admin",
  "static",
  "public",
  "assets",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
  "sw.js",
  "new",
  "login",
  "logout",
  "signup",
  "settings",
  "about",
  "help",
  "terms",
  "privacy",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
