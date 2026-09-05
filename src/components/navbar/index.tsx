import { Button } from "@mui/joy";
import Link from "next/link";
import styles from './index.module.scss'
import ThemeToggle from "@/components/theme-toggle";

export default function Navbar() {
  return (
    <nav className={styles.navContainer}>
      <div className={styles.linkContainer}>
        <Link href={"/"}>
          <Button variant="outlined" color="neutral" size="sm">
            <span>🏠 Home</span>
          </Button>
        </Link>
      </div>
      <div>
        <ThemeToggle />
      </div>
    </nav>
  )
}