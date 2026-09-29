import type { LucideIcon } from 'lucide-react'

interface Item {
  label: string
  value: string
}

interface Props {
  icon: LucideIcon
  title: string
  desc: string
  items: Item[]
}

export function StaticSettingsSection({ icon: Icon, title, desc, items }: Props) {
  return (
    <div className="admin-card">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-brand-600" />
        </div>
        <div>
          <h3 className="font-bold text-text-primary">{title}</h3>
          <p className="text-text-muted text-sm">{desc}</p>
        </div>
      </div>
      <div className="divide-y divide-surface-border">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between py-3">
            <span className="text-sm text-text-secondary">{item.label}</span>
            <span className="text-sm font-semibold text-text-primary">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
