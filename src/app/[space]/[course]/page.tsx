import { notFound } from "next/navigation";
import Link from "next/link";
import { findSpaceBySlug } from "@/db/space.repository";
import { getCourseBySlug } from "@/db/course.repository";
import { formatDateOnly } from "@/lib/formatDate";

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
    <main>
      <h1>{course.name}</h1>
      <p>{course.professor}</p>
      {course.sessions.length === 0 ? (
        <p>Nenhuma aula registrada ainda.</p>
      ) : (
        <ul>
          {course.sessions.map((session) => (
            <li key={session.id}>
              <Link href={`/${space.slug}/${course.slug}/${session.slug}`}>
                {session.title} — {formatDateOnly(session.recordingDate)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
