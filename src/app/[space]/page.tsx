import { notFound } from "next/navigation";
import Link from "next/link";
import { findSpaceBySlug } from "@/db/space.repository";
import { listCoursesBySpace } from "@/db/course.repository";
import IngestForm from "@/components/ingest-form";

type Props = {
  params: Promise<{ space: string }>;
};

// Dashboard (próximas provas, destaques recentes) é Fase 5 — aqui é só a
// lista de cursos, lendo do Postgres.
export default async function SpacePage({ params }: Props) {
  const { space: spaceSlug } = await params;

  const space = await findSpaceBySlug(spaceSlug);
  if (!space) notFound();

  const courses = await listCoursesBySpace(space.id);

  return (
    <main>
      <h1>{space.slug}</h1>
      <IngestForm spaceSlug={space.slug} />
      {courses.length === 0 ? (
        <p>Nenhum curso registrado ainda neste espaço.</p>
      ) : (
        <ul>
          {courses.map((course) => (
            <li key={course.id}>
              <Link href={`/${space.slug}/${course.slug}`}>
                {course.name} — {course.professor}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
