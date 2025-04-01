import LinkList from '@/components/link-list';
import { getAulaListByDisciplinaId } from '@/services/firebase.service';
import { Fragment } from 'react';

type Props = {
  params: Promise<{
    disciplina: string
  }>
}

export default async function DisciplinaPage({ params }: Props) {
  const { disciplina } = await params

  const aulas = await getAulaListByDisciplinaId(disciplina)

  return (
    <Fragment>
      <h1>{disciplina}</h1>
      <hr />
      <LinkList data={aulas} />
    </Fragment>
  )
}