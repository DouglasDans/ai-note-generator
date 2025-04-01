import LinkList from "@/components/link-list";
import { getAllDisciplinas } from "@/services/firebase.service";
import { Fragment } from "react";

export default async function Home() {
  const disciplinas = await getAllDisciplinas();
  console.log(disciplinas);

  return (
    <Fragment>
      <h1>Disciplinas registradas</h1>
      <hr />
      <LinkList data={disciplinas} />
    </Fragment>
  );
}
