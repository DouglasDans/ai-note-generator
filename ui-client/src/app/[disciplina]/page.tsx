import LinkList from '@/components/link-list';
import { getAulaListByDisciplinaId } from '@/services/firebase.service';
import { Aula } from '@/types/JsonResponse';
import { Fragment } from 'react';
import json_db from '../../../../generated_notes_db.json'
import { NotesDB } from '@/types/collectionTypes';
import { JSONToAulasCollectionListByDisciplinaId } from '@/mappers/jsonToTypedObject';


type Props = {
  params: Promise<{
    disciplina: string
  }>
}

export default async function DisciplinaPage({ params }: Props) {
  const { disciplina } = await params
  const typedDb = json_db as unknown as NotesDB;
  const aulas = JSONToAulasCollectionListByDisciplinaId(typedDb, disciplina)

  return (
    <Fragment>
      <h1>{disciplina}</h1>
      <hr />
      <LinkList data={aulas} />
    </Fragment>
  )
}