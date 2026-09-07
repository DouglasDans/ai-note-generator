import { prisma } from "@/db/client";

export type UpcomingItem = {
  id: string;
  kind: "task" | "mentionedDate";
  description: string;
  dateIso: Date;
  sessionId: string;
  sessionTitle: string;
  sessionSlug: string;
  courseId: string;
  courseName: string;
  courseSlug: string;
};

/**
 * Itens sem *_iso ficam de fora: sem data normalizada não dá pra saber se já
 * passaram ou não (ver PLANO.md, decisão 4.4 — só o texto original existe
 * nesse caso, ex.: "antes do feriado").
 */
export async function listUpcomingItemsBySpace(
  spaceId: string,
  now: Date = new Date()
): Promise<UpcomingItem[]> {
  const [taskItems, mentionedDates] = await Promise.all([
    prisma.taskItem.findMany({
      where: {
        dueDateIso: { gte: now },
        session: { course: { spaceId } },
      },
      include: { session: { include: { course: true } } },
    }),
    prisma.mentionedDate.findMany({
      where: {
        dateIso: { gte: now },
        session: { course: { spaceId } },
      },
      include: { session: { include: { course: true } } },
    }),
  ]);

  const items: UpcomingItem[] = [
    ...taskItems.map((item) => ({
      id: item.id,
      kind: "task" as const,
      description: `${item.title}: ${item.description}`,
      dateIso: item.dueDateIso as Date,
      sessionId: item.sessionId,
      sessionTitle: item.session.title,
      sessionSlug: item.session.slug,
      courseId: item.session.courseId,
      courseName: item.session.course.name,
      courseSlug: item.session.course.slug,
    })),
    ...mentionedDates.map((item) => ({
      id: item.id,
      kind: "mentionedDate" as const,
      description: item.description,
      dateIso: item.dateIso as Date,
      sessionId: item.sessionId,
      sessionTitle: item.session.title,
      sessionSlug: item.session.slug,
      courseId: item.session.courseId,
      courseName: item.session.course.name,
      courseSlug: item.session.course.slug,
    })),
  ];

  return items.sort((a, b) => a.dateIso.getTime() - b.dateIso.getTime());
}
