"use server";

import { redirect } from "next/navigation";
import { createSpace, findSpaceBySlug, SlugTakenError } from "@/db/space.repository";
import { InvalidSlugError } from "@/db/slug";

/**
 * Um único form na home resolve tanto "entrar" quanto "criar" — não há
 * distinção de credencial hoje entre as duas ações (ver PLANO.md, decisão
 * 4.1: a separação leitura/escrita que importa é sobre subir áudio, ainda
 * não implementada).
 *
 * redirect() lança um erro internamente para o Next.js interceptar — por
 * isso as chamadas ficam fora do try, e a de erro só dentro do catch (não
 * dentro de outro try), conforme a doc oficial do Next.js exige.
 */
export async function goToSpace(formData: FormData) {
  const rawSlug = String(formData.get("slug") ?? "");

  const existing = await findSpaceBySlug(rawSlug);
  if (existing) {
    redirect(`/${existing.slug}`);
  }

  let space;
  try {
    space = await createSpace(rawSlug);
  } catch (error) {
    if (error instanceof InvalidSlugError || error instanceof SlugTakenError) {
      redirect(`/?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  redirect(`/${space.slug}`);
}
