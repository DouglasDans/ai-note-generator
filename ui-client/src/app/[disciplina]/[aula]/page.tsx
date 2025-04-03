import { Aula } from "@/types/JsonResponse"
import { getAulaDetailsById } from "@/services/firebase.service"
import { Fragment } from "react"
import MenuIndex from "@/components/index-menu"
import styles from './page.module.scss'
import AulaContent from "@/components/aula-content";

type Props = {
  params: Promise<{
    aula: string
    disciplina: string
  }>
}

export default async function AulaPage({ params }: Props) {
  const { aula, disciplina } = await params
  const aulaData = await getAulaDetailsById(disciplina, aula) as Aula

  return (
    <Fragment>
      <h1>{aulaData.titulo}</h1>
      <div className={styles.header}>
        <MenuIndex links={[
          ["Tarefas Futuras", "#tarefas-futuras"],
          ["Datas Futuras Mencionadas", "#datas-futuras"],
          ["Resumo da Aula", "#resumo"],
          ["Discussões Off Topic", "#off-topic"],
          ["Atividades Realizadas em Aula", "#atividades"],
          ["Tags", "#tags"]
        ]} />
        <div className={styles.pageDetails}>
          {aulaData.prompt_version && <small>Versão do Prompt: {aulaData.prompt_version}</small>}
          <small>Utilize essas informações como um norte, o resumo por IA nem sempre pode estar correto</small>
        </div>
      </div>
      <hr />

      <AulaContent aula={aulaData} />
    </Fragment>
  )
}