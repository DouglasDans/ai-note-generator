import { notFound } from "next/navigation";
import Link from "next/link";
import { findSpaceBySlug } from "@/db/space.repository";
import { getCourseBySlug } from "@/db/course.repository";
import { formatDateOnly } from "@/lib/formatDate";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  params: Promise<{ space: string; course: string }>;
};

export default async function CoursePage({ params }: Props) {
  const { space: spaceSlug, course: courseSlug } = await params;

  const space = await findSpaceBySlug(spaceSlug);
  if (!space) notFound();

  const course = await getCourseBySlug(space.id, courseSlug);
  if (!course) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{course.name}</h1>
        <p className="text-sm text-muted-foreground">{course.professor}</p>
      </div>

      {course.sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma aula registrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {course.sessions.map((session) => (
            <Link key={session.id} href={`/${space.slug}/${course.slug}/${session.slug}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-row items-center justify-between">
                  <span className="font-medium">{session.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDateOnly(session.recordingDate)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
