import { Button } from "@mui/joy"
import { Fragment } from "react"
import styles from './index.module.scss'

type Props = {}

export default function LinkList({ }: Props) {
  return (
    <div className={styles.container}>
      <Button className={styles.button} variant="soft" color="primary" fullWidth>aaaa</Button>
    </div>
  )
}