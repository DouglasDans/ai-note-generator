import { Fragment } from "react";
import styles from "./index.module.scss";
import { Card, CardContent, Chip, Typography } from "@mui/joy";
import { Aula } from "@/types/JsonResponse";
import { MDXRemote } from 'next-mdx-remote/rsc'

type Props = {
	aula: Aula
}

export default async function AulaContent({ aula }: Props) {
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
								<MDXRemote source={item.descricao} />
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
								<MDXRemote source={item.descricao} />
							</CardContent>
						</Card>
					)
				})}
			</div>
			<hr />

			<h2 id="resumo">Resumo da Aula</h2>
			<MDXRemote source={aula.resumo} />
			<hr />

			<h2 id="atividades">Atividades Realizadas em Aula</h2>
			<MDXRemote source={aula.atividades_em_aula} />
			<hr />

			<h2 id="off-topic">Discussões Off Topic</h2>
			<MDXRemote source={aula.off_topic} />
			<hr />

			<h2 id="tags">Tags</h2>
			{aula.tags.map((item, index) => {
				return <Chip variant="soft" key={index}>{item}</Chip>
			})}
		</Fragment>
	)
}