import { SettingsNav } from './SettingsNav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-page">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 max-w-5xl">
        <SettingsNav />
        <div className="flex-1 min-w-0 space-y-4">{children}</div>
      </div>
    </div>
  )
}
