import { Button } from "@mui/joy"
import styles from './index.module.scss'
import Link from 'next/link'

type DisciplinaCollection = {
  nome: string
  professor: string
  id: string
}

type AulaCollection = {
  id: string
  disciplinaId: string
  title: string
  data: string
}

type Props = {
  data: Array<DisciplinaCollection | AulaCollection>
}

export default function LinkList({ data }: Props) {
  return (
    <div className={styles.container}>
      {data.map((item, index) => {

        return (
          <Link
            key={index}
            className={styles.link}
            href={("title" in item) ? `${item.disciplinaId}/${item.id}` : item.id}
          >
            {("nome" in item) && <Button className={styles.button} variant="soft" color="primary" fullWidth>
              <span>{item.nome}</span>
              <small>Professor(a) {item.professor}</small>
            </Button>}
            {("title" in item) && <Button className={styles.button} variant="soft" color="primary" fullWidth>
              <span>{item.title}</span>
              <small>{item.data}</small>
            </Button>}
          </Link>
        )
      })}
    </div>
  )
}