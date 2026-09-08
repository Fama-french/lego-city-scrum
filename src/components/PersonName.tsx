import { memberColor } from '../lib/colors'

export function PersonName({ name }: { name: string }) {
  return <span style={{ color: memberColor(name), fontWeight: 700 }}>{name}</span>
}
