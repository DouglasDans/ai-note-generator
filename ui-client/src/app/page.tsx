import LinkList from "@/components/link-list";
import { Fragment } from "react";
import json_db from '../../../generated_notes_db.json'
import { NotesDB } from "@/types/collectionTypes";
import { JSONToDisciplinasCollectionList } from "@/mappers/jsonToTypedObject";

export default async function Home() {
  const typedDb = json_db as unknown as NotesDB;
  const disciplinas = JSONToDisciplinasCollectionList(typedDb)

  return (
    <Fragment>
      <h1>Disciplinas registradas</h1>
      <hr />

      <LinkList data={disciplinas} />
    </Fragment>
  );
}
