import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { findSpaceBySlug } from "@/db/space.repository";
import { getCourseBySlug, getSessionBySlug } from "@/db/course.repository";
import { formatDateOnly } from "@/lib/formatDate";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Props = {
  params: Promise<{ space: string; course: string; session: string }>;
};

export default async function SessionPage({ params }: Props) {
  const { space: spaceSlug, course: courseSlug, session: sessionSlug } =
    await params;

  const space = await findSpaceBySlug(spaceSlug);
  if (!space) notFound();

  const course = await getCourseBySlug(space.id, courseSlug);
  if (!course) notFound();

  const session = await getSessionBySlug(course.id, sessionSlug);
  if (!session) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{session.title}</h1>
        <p className="text-sm text-muted-foreground">
          {course.name} — {formatDateOnly(session.recordingDate)}
        </p>
      </div>

      {session.taskItems.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Tarefas futuras</h2>
          <p className="text-sm text-muted-foreground">{session.futureTasksOverview}</p>
          <ul className="flex flex-col gap-1.5">
            {session.taskItems.map((item) => (
              <li key={item.id} className="text-sm">
                <strong>{item.title}</strong>: {item.description} —{" "}
                {item.dueDateIso
                  ? formatDateOnly(item.dueDateIso)
                  : item.dueDateOriginalText}
              </li>
            ))}
          </ul>
        </section>
      )}

      {session.mentionedDates.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Datas mencionadas</h2>
          <ul className="flex flex-col gap-1.5">
            {session.mentionedDates.map((item) => (
              <li key={item.id} className="text-sm">
                {item.description} —{" "}
                {item.dateIso ? formatDateOnly(item.dateIso) : item.originalText}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Separator />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Resumo</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MDXRemote source={session.summary} />
        </div>
      </section>

      {session.classActivities && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Atividades em aula</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MDXRemote source={session.classActivities} />
          </div>
        </section>
      )}

      {session.offTopic && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Off-topic</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MDXRemote source={session.offTopic} />
          </div>
        </section>
      )}

      {session.tags.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {session.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
