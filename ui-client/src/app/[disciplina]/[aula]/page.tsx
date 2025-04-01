import { Aula } from "@/types/JsonResponse"
import { getAulaDetailsById } from "@/services/firebase.service"
import { Fragment } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import MenuIndex from "@/components/index-menu"
import { Card, CardContent, Chip, Typography } from "@mui/joy"
import styles from './page.module.scss'

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
        <small>Utilize essas informações como um norte, o resumo por IA nem sempre pode estar correto</small>
      </div>
      <hr />

      <h2 id="tarefas-futuras">Tarefas Futuras</h2>
      <p>{aulaData.tarefas_futuras.descricao_geral}</p>
      <div className={styles.cardContainer}>
        {aulaData.tarefas_futuras.detalhes.map((item, index) => {
          return (
            <Card variant="soft" color="danger" key={index}>
              <CardContent>
                <Typography level="title-md">{item.titulo}</Typography>
                <Markdown remarkPlugins={[remarkGfm]}>{item.descricao}</Markdown>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <hr />

      <h2 id="datas-futuras">Datas Futuras Mencionadas</h2>
      <div className={styles.cardContainer}>
        {aulaData.datas_futuras_mencionadas.map((item, index) => {
          return (
            <Card variant="soft" color="warning" key={index}>
              <CardContent>
                <Typography level="title-md">{item.data}</Typography>
                <Markdown remarkPlugins={[remarkGfm]}>{item.descricao}</Markdown>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <hr />

      <h2 id="resumo">Resumo da Aula</h2>
      <Markdown remarkPlugins={[remarkGfm]}>{aulaData.resumo}</Markdown>
      <hr />

      <h2 id="off-topic">Discussões Off Topic</h2>
      <Markdown remarkPlugins={[remarkGfm]}>{aulaData.off_topic}</Markdown>
      <hr />

      <h2 id="atividades">Atividades Realizadas em Aula</h2>
      <Markdown remarkPlugins={[remarkGfm]}>{aulaData.atividades_em_aula}</Markdown>
      <hr />

      <h2 id="tags">Tags</h2>
      {aulaData.tags.map((item, index) => {
        return <Chip variant="soft" key={index}>{item}</Chip>
      })}

    </Fragment>
  )
}