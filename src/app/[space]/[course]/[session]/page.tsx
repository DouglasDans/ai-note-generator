import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { findSpaceBySlug } from "@/db/space.repository";
import { getCourseBySlug, getSessionBySlug } from "@/db/course.repository";
import { formatDateOnly } from "@/lib/formatDate";

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
    <main>
      <h1>{session.title}</h1>
      <p>
        {course.name} — {formatDateOnly(session.recordingDate)}
      </p>

      {session.taskItems.length > 0 && (
        <section>
          <h2>Tarefas futuras</h2>
          <p>{session.futureTasksOverview}</p>
          <ul>
            {session.taskItems.map((item) => (
              <li key={item.id}>
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
        <section>
          <h2>Datas mencionadas</h2>
          <ul>
            {session.mentionedDates.map((item) => (
              <li key={item.id}>
                {item.description} —{" "}
                {item.dateIso
                  ? formatDateOnly(item.dateIso)
                  : item.originalText}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Resumo</h2>
        <MDXRemote source={session.summary} />
      </section>

      {session.classActivities && (
        <section>
          <h2>Atividades em aula</h2>
          <MDXRemote source={session.classActivities} />
        </section>
      )}

      {session.offTopic && (
        <section>
          <h2>Off-topic</h2>
          <MDXRemote source={session.offTopic} />
        </section>
      )}

      {session.tags.length > 0 && (
        <section>
          <h2>Tags</h2>
          <ul>
            {session.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
