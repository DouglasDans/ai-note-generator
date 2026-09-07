import { notFound } from "next/navigation";
import Link from "next/link";
import { findSpaceBySlug } from "@/db/space.repository";
import { listCoursesBySpace } from "@/db/course.repository";
import IngestForm from "@/components/ingest-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: Promise<{ space: string }>;
};

// Dashboard (próximas provas, destaques recentes) é Fase 5d — aqui é só a
// lista de cursos, lendo do Postgres.
export default async function SpacePage({ params }: Props) {
  const { space: spaceSlug } = await params;

  const space = await findSpaceBySlug(spaceSlug);
  if (!space) notFound();

  const courses = await listCoursesBySpace(space.id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">{space.slug}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Enviar nova aula</CardTitle>
        </CardHeader>
        <CardContent>
          <IngestForm spaceSlug={space.slug} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Cursos</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum curso registrado ainda neste espaço.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {courses.map((course) => (
              <Link key={course.id} href={`/${space.slug}/${course.slug}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex flex-row items-center justify-between">
                    <span className="font-medium">{course.name}</span>
                    <span className="text-sm text-muted-foreground">{course.professor}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
