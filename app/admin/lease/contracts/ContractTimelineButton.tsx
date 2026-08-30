'use client'

import { useMemo, useState } from 'react'
import {
  CalendarClock,
  FilePlus,
  Flag,
  History,
  Package,
  Pencil,
  ShoppingBag,
  Droplets,
} from 'lucide-react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  ACTIVITY_KIND_LABELS,
  formatLiters,
  type ContractActivity,
  type ContractActivityKind,
} from '@/lib/lease/contract-activity'

const KIND_STYLE: Record<ContractActivityKind, { dot: string; icon: typeof FilePlus }> = {
  created: { dot: 'bg-brand-600', icon: FilePlus },
  updated: { dot: 'bg-violet-500', icon: Pencil },
  started: { dot: 'bg-emerald-500', icon: CalendarClock },
  ending: { dot: 'bg-amber-500', icon: Flag },
  device: { dot: 'bg-sky-500', icon: Package },
  refill: { dot: 'bg-cyan-600', icon: Droplets },
  order: { dot: 'bg-rose-500', icon: ShoppingBag },
}

const FILTERS: Array<{ id: 'all' | ContractActivityKind; label: string }> = [
  { id: 'all', label: 'Të gjitha' },
  { id: 'refill', label: 'Rimbushje' },
  { id: 'order', label: 'Porosi' },
  { id: 'device', label: 'Pajisje' },
  { id: 'updated', label: 'Përditësime' },
]

export function ContractTimelineButton({ activity }: { activity: ContractActivity }) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')

  const events = useMemo(
    () => filter === 'all' ? activity.events : activity.events.filter(event => event.kind === filter),
    [activity.events, filter]
  )

  const maxLiters = Math.max(...activity.months.map(month => month.liters), 0.001)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost gap-1.5 text-sm">
        <History size={15} />
        Timeline
      </button>

      <Dialog modal open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Historia e kontratës</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Ngjarje" value={String(activity.events.length)} />
              <Stat label="Rimbushje" value={String(activity.totalCount)} />
              <Stat label="Litra" value={formatLiters(activity.totalLiters)} />
              <Stat label="Porosi web" value={String(activity.orderCount)} />
            </div>

            {activity.months.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted mb-3">Litra të dërguara çdo muaj</h4>
                <div className="flex items-end gap-2 h-28 px-1">
                  {activity.months.map(month => (
                    <div key={month.key} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] tabular-nums text-text-muted">{formatLiters(month.liters)}</span>
                      <div
                        className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-brand-700 to-cyan-400"
                        style={{ height: `${Math.max(8, (month.liters / maxLiters) * 100)}%` }}
                      />
                      <span className="text-[10px] text-text-muted truncate w-full text-center capitalize">
                        {month.label.replace(' ', '\n')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors',
                    filter === item.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-text-secondary border-surface-border hover:bg-surface-soft'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {events.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-10">Nuk ka ngjarje në këtë filtër.</p>
            ) : (
              <ol className="relative ml-3 border-l-2 border-slate-200">
                {events.map((event, index) => {
                  const style = KIND_STYLE[event.kind]
                  const Icon = style.icon
                  const isLast = index === events.length - 1
                  return (
                    <li key={event.id} className={cn('relative pl-6', isLast ? 'pb-1' : 'pb-6')}>
                      <span className={cn('absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm', style.dot)}>
                        <Icon size={9} />
                      </span>
                      <p className="text-[11px] text-text-muted">
                        {new Date(event.at).toLocaleString('sq-AL')}
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                          {ACTIVITY_KIND_LABELS[event.kind]}
                        </span>
                      </p>
                      <p className="text-sm font-semibold text-text-primary mt-0.5">{event.title}</p>
                      <p className="text-sm text-text-secondary">{event.detail}</p>
                      {event.meta && <p className="text-xs text-text-muted mt-0.5">{event.meta}</p>}
                    </li>
                  )
                })}
              </ol>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-soft px-3 py-2.5">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className="text-base font-semibold tabular-nums">{value}</p>
    </div>
  )
}
