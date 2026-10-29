import { icons, type LucideProps } from 'lucide-react'

type LucideIconProps = {
  name?: string | null
} & LucideProps

export default function LucideIcon({ name, ...props }: LucideIconProps) {
  if (!name) return null

  const Icon = icons[name as keyof typeof icons]
  if (!Icon) return null

  return <Icon {...props} />
}
