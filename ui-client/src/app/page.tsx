import LinkList from "@/components/link-list";
import { Fragment } from "react";

export default function Home() {
  return (
    <Fragment>
      <h1>Disciplinas registradas</h1>
      <hr />
      <LinkList />
    </Fragment>
  );
}
