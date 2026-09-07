import { notFound } from "next/navigation";
import Link from "next/link";
import { findSpaceBySlug } from "@/db/space.repository";
import { listCoursesBySpace } from "@/db/course.repository";
import { listUpcomingItemsBySpace } from "@/db/dashboard.repository";
import UploadSessionDialog from "@/components/upload-session-dialog";
import { formatDateOnly } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  params: Promise<{ space: string }>;
};

export default async function SpacePage({ params }: Props) {
  const { space: spaceSlug } = await params;

  const space = await findSpaceBySlug(spaceSlug);
  if (!space) notFound();

  const [courses, upcomingItems] = await Promise.all([
    listCoursesBySpace(space.id),
    listUpcomingItemsBySpace(space.id),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{space.slug}</h1>
        <UploadSessionDialog
          spaceSlug={space.slug}
          disciplines={courses.map((course) => course.name)}
        />
      </div>

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
                  className={cn(
                    "font-medium hover:underline",
                    item.kind === "task"
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
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
        <h2 className="text-lg font-medium">Disciplinas</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma disciplina registrada ainda neste espaço.
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
