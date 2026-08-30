'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export type SearchableOption = {
  value: string
  label: string
  group?: string
}

export type SearchableType = 'clients' | 'devices' | 'materials' | 'contracts' | 'cities' | 'categories' | 'brands' | 'products'

interface Props {
  value: string
  onChange: (value: string) => void
  options: SearchableOption[]
  searchType?: SearchableType
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  allowClear?: boolean
}

export function SearchableSelect({
  value,
  onChange,
  options,
  searchType,
  placeholder = 'Zgjedh...',
  searchPlaceholder = 'Kërko...',
  emptyText = 'Asgjë nuk u gjet',
  disabled,
  allowClear,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, { wait: 320 })
  const [remote, setRemote] = useState<SearchableOption[] | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const remoteEnabled = Boolean(searchType && searchType !== 'cities')

  useEffect(() => {
    if (!open || !remoteEnabled || !searchType) {
      setRemote(null)
      setLoading(false)
      return
    }

    const ctrl = new AbortController()
    setLoading(true)
    fetch(`/api/admin/options?type=${searchType}&q=${encodeURIComponent(debouncedQuery)}`, {
      signal: ctrl.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error('search failed')
        return res.json()
      })
      .then((data: { options?: SearchableOption[] }) => {
        setRemote(data.options ?? [])
      })
      .catch(err => {
        if (err?.name !== 'AbortError') setRemote(null)
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [debouncedQuery, open, remoteEnabled, searchType])

  const items = useMemo(() => {
    if (!remoteEnabled || remote == null) return options
    if (remote.length > 0) return remote
    if (!debouncedQuery) return options
    const needle = debouncedQuery.toLowerCase()
    return options.filter(item => item.label.toLowerCase().includes(needle))
  }, [remoteEnabled, remote, options, debouncedQuery])

  const selected =
    items.find(item => item.value === value) ??
    options.find(item => item.value === value)

  const grouped = useMemo(() => {
    const map = new Map<string, SearchableOption[]>()
    for (const item of items) {
      const key = item.group ?? ''
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [items])

  return (
    <Popover open={open} onOpenChange={next => {
      setOpen(next)
      if (!next) setQuery('')
    }} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'input flex items-center justify-between gap-2 text-left font-normal',
            !selected && 'text-text-muted'
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown size={14} className="shrink-0 text-text-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        onOpenAutoFocus={e => {
          e.preventDefault()
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
        onCloseAutoFocus={e => e.preventDefault()}
      >
        <Command shouldFilter={!remoteEnabled} label={placeholder}>
          <CommandInput
            ref={inputRef}
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-text-muted">
                <Loader2 size={14} className="animate-spin" />
                Duke kërkuar...
              </div>
            )}
            {!loading && <CommandEmpty>{emptyText}</CommandEmpty>}
            {grouped.map(([group, groupItems]) => (
              <CommandGroup key={group || 'all'} heading={group || undefined}>
                {allowClear && !group && (
                  <CommandItem
                    value="__clear__"
                    onSelect={() => {
                      onChange('')
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <span className="text-text-muted">Pastro</span>
                  </CommandItem>
                )}
                {groupItems.map(item => (
                  <CommandItem
                    key={item.value}
                    value={`${item.label} ${item.value}`}
                    onSelect={() => {
                      onChange(item.value)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <Check
                      size={14}
                      className={cn('shrink-0', item.value === value ? 'opacity-100 text-brand-600' : 'opacity-0')}
                    />
                    <span className="truncate">{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
