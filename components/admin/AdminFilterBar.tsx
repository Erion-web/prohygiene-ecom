import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminFilterBarProps {
  children?: React.ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  className?: string
}

export function AdminFilterBar({
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Kërko...',
  className,
}: AdminFilterBarProps) {
  return (
    <div className={cn('admin-filter-bar', className)}>
      {onSearchChange !== undefined && (
        <div className="admin-search min-w-[200px] flex-1 max-w-sm">
          <Search size={15} className="text-text-muted flex-shrink-0" />
          <input
            type="search"
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent outline-none min-w-0"
          />
        </div>
      )}
      {children}
    </div>
  )
}
