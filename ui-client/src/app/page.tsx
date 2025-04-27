import LinkList from "@/components/link-list";
import { Fragment } from "react";
import json_db from '../../../generated_notes_db.json'
import { DisciplinaCollection } from "@/types/collectionTypes";

export default async function Home() {
  const lengthJson = Object.keys(json_db.disciplinas).length
  const disciplinas: Array<DisciplinaCollection> = []

  for (let i = 1; i < lengthJson; i++) {
    if (json_db.disciplinas[i.toString()]) {
      disciplinas.push(json_db.disciplinas[i.toString()])
    }
  }

  return (
    <Fragment>
      <h1>Disciplinas registradas</h1>
      <hr />

      <LinkList data={disciplinas} />
    </Fragment>
  );
}
