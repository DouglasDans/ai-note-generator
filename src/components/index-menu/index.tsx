import { Dropdown, Menu, MenuButton, MenuItem } from '@mui/joy'
import Link from 'next/link'

type Props = {
  links: Array<string[]>
}

export default function MenuIndex({ links }: Props) {
  return (
    <Dropdown>
      <MenuButton size="sm">
        Índice
      </MenuButton>
      <Menu size="sm">
        {links.map((item, index) => {
          return (
            <MenuItem key={index}>
              <Link href={item[1]}>
                {item[0]}
              </Link>
            </MenuItem>
          )
        })}
      </Menu>
    </Dropdown>
  )
}