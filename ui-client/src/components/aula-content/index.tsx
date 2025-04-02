import {Fragment} from "react";
import styles from "./index.module.scss";
import {Card, CardContent, Chip, Typography} from "@mui/joy";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {Aula} from "@/types/JsonResponse";

type Props = {
	aula: Aula
}

export default async function AulaContent({ aula } : Props) {
	return (
		<Fragment>
			<h2 id="tarefas-futuras">Tarefas Futuras</h2>
			<p>{aula.tarefas_futuras.descricao_geral}</p>
			<div className={styles.cardContainer}>
				{aula.tarefas_futuras.detalhes.map((item, index) => {
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
				{aula.datas_futuras_mencionadas.map((item, index) => {
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
			<Markdown remarkPlugins={[remarkGfm]}>{aula.resumo}</Markdown>
			<hr />


			<h2 id="atividades">Atividades Realizadas em Aula</h2>
			<Markdown remarkPlugins={[remarkGfm]}>{aula.atividades_em_aula}</Markdown>
			<hr />

			<h2 id="off-topic">Discussões Off Topic</h2>
			<Markdown remarkPlugins={[remarkGfm]}>{aula.off_topic}</Markdown>
			<hr />

			<h2 id="tags">Tags</h2>
			{aula.tags.map((item, index) => {
				return <Chip variant="soft" key={index}>{item}</Chip>
			})}
		</Fragment>
	)
}