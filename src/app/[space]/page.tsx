import { notFound } from "next/navigation";
import Link from "next/link";
import { findSpaceBySlug } from "@/db/space.repository";
import { listCoursesBySpace } from "@/db/course.repository";
import { listRecentSessionsBySpace, listUpcomingItemsBySpace } from "@/db/dashboard.repository";
import IngestForm from "@/components/ingest-form";
import { formatDateOnly } from "@/lib/formatDate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: Promise<{ space: string }>;
};

export default async function SpacePage({ params }: Props) {
  const { space: spaceSlug } = await params;

  const space = await findSpaceBySlug(spaceSlug);
  if (!space) notFound();

  const [courses, upcomingItems, recentSessions] = await Promise.all([
    listCoursesBySpace(space.id),
    listUpcomingItemsBySpace(space.id),
    listRecentSessionsBySpace(space.id),
  ]);

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
        <h2 className="text-lg font-medium">Próximas provas e entregas</h2>
        {upcomingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada pela frente por enquanto.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {upcomingItems.map((item) => (
              <li key={item.id} className="text-sm">
                <Link
                  href={`/${space.slug}/${item.courseSlug}/${item.sessionSlug}`}
                  className="hover:underline"
                >
                  {item.description}
                </Link>{" "}
                <span className="text-muted-foreground">
                  — {formatDateOnly(item.dateIso)} ({item.courseName})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Destaques recentes</h2>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma aula registrada ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {recentSessions.map((session) => (
              <li key={session.id} className="text-sm">
                <Link
                  href={`/${space.slug}/${session.course.slug}/${session.slug}`}
                  className="hover:underline"
                >
                  {session.title}
                </Link>{" "}
                <span className="text-muted-foreground">
                  — {formatDateOnly(session.recordingDate)} ({session.course.name})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

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
