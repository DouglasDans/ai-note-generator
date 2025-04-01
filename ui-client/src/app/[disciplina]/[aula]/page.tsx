import { Aula } from "@/@types/JsonResponse"
import { getAulaDetailsById } from "@/services/firebase.service"
import { Fragment } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Props = {
  params: {
    aula: string
    disciplina: string
  }
}

export default async function AulaPage({ params }: Props) {
  const { aula, disciplina } = await params

  const aulaData = await getAulaDetailsById(disciplina, aula) as Aula
  console.log(aulaData);

  return (
    <Fragment>
      <h1>Disciplinas registradas</h1>
      <hr />

      <h2>Resumo da Aula</h2>
      <Markdown remarkPlugins={[remarkGfm]}>{aulaData.resumo}</Markdown>

      <h2>Discussões Off Topic</h2>
      <Markdown remarkPlugins={[remarkGfm]}>{aulaData.off_topic}</Markdown>

      <h2>Atividades Realizadas em Aula</h2>
      <Markdown remarkPlugins={[remarkGfm]}>{aulaData.atividades_em_aula}</Markdown>

    </Fragment>
  )
}