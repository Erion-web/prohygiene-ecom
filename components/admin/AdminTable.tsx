'use client'

import { useRef } from 'react'
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy'
import type { RowData } from '@tanstack/table-core'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'

type ColumnAlign = 'left' | 'right' | 'center'

function columnAlign(meta: unknown): ColumnAlign | undefined {
  if (meta && typeof meta === 'object' && 'align' in meta) {
    const align = (meta as { align?: ColumnAlign }).align
    if (align === 'left' || align === 'right' || align === 'center') return align
  }
  return undefined
}

const ROW_HEIGHT = 52
const DEFAULT_VIRTUAL_THRESHOLD = 40
const DEFAULT_MAX_HEIGHT = 560

export interface AdminTableProps<T extends RowData> {
  data: T[]
  columns: LegacyColumnDef<T, unknown>[]
  emptyMessage?: React.ReactNode
  onRowClick?: (row: T) => void
  virtualizeThreshold?: number
  maxHeight?: number
  className?: string
  getRowId?: (row: T) => string
}

export function AdminTable<T extends RowData>({
  data,
  columns,
  emptyMessage = 'Nuk ka të dhëna',
  onRowClick,
  virtualizeThreshold = DEFAULT_VIRTUAL_THRESHOLD,
  maxHeight = DEFAULT_MAX_HEIGHT,
  className,
  getRowId,
}: AdminTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualize = data.length >= virtualizeThreshold

  const table = useLegacyTable<T>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId
      ? (row, _index) => getRowId(row as T)
      : undefined,
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  if (data.length === 0) {
    return (
      <div className={cn('admin-table-shell', className)}>
        <div className="py-12 text-center text-sm text-text-muted">{emptyMessage}</div>
      </div>
    )
  }

  const colCount = columns.length
  const virtualItems = virtualize ? virtualizer.getVirtualItems() : null
  const paddingTop = virtualItems?.[0]?.start ?? 0
  const paddingBottom = virtualize && virtualItems?.length
    ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0

  const renderRow = (row: (typeof rows)[number], style?: React.CSSProperties) => (
    <tr
      key={row.id}
      onClick={onRowClick ? () => onRowClick(row.original as T) : undefined}
      className={cn('group', onRowClick ? 'cursor-pointer' : undefined)}
      style={style}
    >
      {row.getVisibleCells().map(cell => {
        const align = columnAlign(cell.column.columnDef.meta)
        return (
          <td
            key={cell.id}
            className={cn(
              align === 'right' && 'text-right',
              align === 'center' && 'text-center',
            )}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        )
      })}
    </tr>
  )

  return (
    <div className={cn('admin-table-shell', className)}>
      <div
        ref={scrollRef}
        className={cn('admin-table-scroll', virtualize && 'admin-table-scroll-virtual')}
        style={virtualize ? { maxHeight } : undefined}
      >
        <table className="w-full admin-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-surface-soft/80">
                {headerGroup.headers.map(header => {
                  const align = columnAlign(header.column.columnDef.meta)
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        align === 'right' && 'text-right',
                        align === 'center' && 'text-center',
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualize && paddingTop > 0 && (
              <tr aria-hidden>
                <td colSpan={colCount} style={{ height: paddingTop, padding: 0, border: 0 }} />
              </tr>
            )}
            {virtualize && virtualItems
              ? virtualItems.map(vItem => renderRow(rows[vItem.index], { height: vItem.size }))
              : rows.map(row => renderRow(row))}
            {virtualize && paddingBottom > 0 && (
              <tr aria-hidden>
                <td colSpan={colCount} style={{ height: paddingBottom, padding: 0, border: 0 }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
