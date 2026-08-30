'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, History, Send, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CITIES } from '@/lib/cities'
import { pageNumbers } from '@/lib/admin/pagination'
import { newsletterFormSchema } from '@/lib/validation/admin-schemas'
import { AdminHeader } from '@/components/admin/AdminHeader'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  RECIPIENT_SOURCE_LABELS,
  type NewsletterCampaign,
  type NewsletterRecipient,
} from '@/lib/admin/newsletter-recipients'

interface NewsletterClientProps {
  recipients: NewsletterRecipient[]
  history: NewsletterCampaign[]
}

function campaignText(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

const PAGE_SIZE = 20

export function NewsletterClient({ recipients, history }: NewsletterClientProps) {
  const {
    register,
    handleSubmit,
    reset: resetCompose,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(newsletterFormSchema),
    defaultValues: { subject: '', message: '' },
  })
  const subject = watch('subject')
  const message = watch('message')
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [campaigns, setCampaigns] = useState(history)
  const pageCheckboxRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCampaigns(history)
  }, [history])

  const cityOptions = useMemo(() => {
    const fromData = new Set(recipients.map(r => r.city).filter((value): value is string => Boolean(value)))
    return Array.from(new Set([...CITIES, ...fromData]))
      .sort((a, b) => a.localeCompare(b, 'sq'))
      .map(value => ({ value, label: value }))
  }, [recipients])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return recipients.filter(r => {
      if (city && r.city !== city) return false
      if (!q) return true
      return r.name.toLowerCase().includes(q) || r.email.includes(q) || (r.city?.toLowerCase().includes(q) ?? false)
    })
  }, [recipients, search, city])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filtered.length)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, city])

  const selectedCount = selected.size
  const pageEmails = pageItems.map(r => r.email)
  const allPageSelected = pageEmails.length > 0 && pageEmails.every(email => selected.has(email))
  const somePageSelected = pageEmails.some(email => selected.has(email))

  useEffect(() => {
    if (pageCheckboxRef.current) {
      pageCheckboxRef.current.indeterminate = somePageSelected && !allPageSelected
    }
  }, [somePageSelected, allPageSelected])

  const toggleOne = (email: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  const togglePage = () => {
    setSelected(prev => {
      const next = new Set(prev)
      if (allPageSelected) {
        for (const email of pageEmails) next.delete(email)
      } else {
        for (const email of pageEmails) next.add(email)
      }
      return next
    })
  }

  const selectFiltered = () => {
    setSelected(prev => {
      const next = new Set(prev)
      for (const row of filtered) next.add(row.email)
      return next
    })
  }

  const selectCity = (value: string) => {
    if (!value) return
    setSelected(prev => {
      const next = new Set(prev)
      for (const row of recipients) {
        if (row.city === value) next.add(row.email)
      }
      return next
    })
    setCity(value)
  }

  const clearSelected = () => setSelected(new Set())

  const handleSend = handleSubmit(async ({ subject, message }) => {
    if (selectedCount === 0) {
      toast.error('Zgjidhni të paktën një marrës')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, emails: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed')
      toast.success(`U dërgua tek ${data.sent} marrës.`)
      if (data.campaign) {
        setCampaigns(prev => [data.campaign as NewsletterCampaign, ...prev.filter(item => item.id !== data.campaign.id)])
      }
      resetCompose()
      setConfirming(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dërgimi dështoi.')
    } finally {
      setSending(false)
      setConfirming(false)
    }
  })

  return (
    <div>
      <AdminHeader
        title="Newsletter"
        subtitle={`${recipients.length} marrës me email`}
        actions={
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="btn-secondary gap-1.5 text-xs py-1.5 px-3"
          >
            <History size={14} />
            Historia
          </button>
        }
      />
      <div className="admin-page space-y-5">
      <div className="admin-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="admin-section-title">Marrësit</h3>
            <p className="text-xs text-text-muted mt-1">
              {recipients.length} klientë me email · {selectedCount} të zgjedhur
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary bg-surface-soft rounded-xl px-3 py-2">
            <Users size={16} className="text-brand-600" />
            Do t&apos;u dërgohet <strong>{selectedCount}</strong> {selectedCount === 1 ? 'marrësi' : 'marrësve'}.
          </div>
        </div>

        <div className="grid sm:grid-cols-[1fr_220px] gap-3">
          <div>
            <label className="label">Kërko</label>
            <input
              type="search"
              className="input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Emër, email ose qytet..."
            />
          </div>
          <div>
            <label className="label">Lokacioni</label>
            <SearchableSelect
              value={city}
              onChange={setCity}
              options={cityOptions}
              placeholder="Të gjitha qytetet"
              searchPlaceholder="Kërko qytetin..."
              allowClear
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={selectFiltered} disabled={filtered.length === 0} className="btn-secondary text-xs py-1.5 px-3">
            Zgjidh të gjithë{filtered.length !== recipients.length ? ` (${filtered.length})` : ''}
          </button>
          <button
            type="button"
            onClick={() => selectCity(city)}
            disabled={!city}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Zgjidh këtë qytet
          </button>
          <button type="button" onClick={clearSelected} disabled={selectedCount === 0} className="btn-ghost text-xs py-1.5 px-3">
            Pastro zgjedhjen
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-left text-xs text-text-muted">
              <tr>
                <th className="px-3 py-2 w-10">
                  <input
                    ref={pageCheckboxRef}
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={togglePage}
                    aria-label="Zgjidh faqen"
                  />
                </th>
                <th className="px-3 py-2 font-semibold">Emri</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Qyteti</th>
                <th className="px-3 py-2 font-semibold">Tipi</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(row => (
                <tr key={row.email} className="border-t border-surface-border">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row.email)}
                      onChange={() => toggleOne(row.email)}
                      aria-label={row.email}
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900">{row.name}</td>
                  <td className="px-3 py-2 text-text-secondary font-mono text-xs">{row.email}</td>
                  <td className="px-3 py-2 text-text-secondary">{row.city || '—'}</td>
                  <td className="px-3 py-2 text-xs text-text-muted">{RECIPIENT_SOURCE_LABELS[row.source]}</td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-text-muted">
                    Asnjë marrës nuk u gjet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400 tabular-nums">
              {pageStart}–{pageEnd} nga {filtered.length}
            </p>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Faqja e mëparshme"
              >
                <ChevronLeft size={15} />
              </button>
              {pageNumbers(currentPage, totalPages).map((item, i) =>
                item === 'gap' ? (
                  <span key={`gap-${i}`} className="px-1.5 text-xs text-gray-300">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold tabular-nums ${
                      item === currentPage ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Faqja tjetër"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="admin-card space-y-5">
        <div>
          <label className="label">Subjekti</label>
          <input
            type="text"
            className="input"
            {...register('subject')}
            placeholder="p.sh. Ofertë e re -20% në detergjentë"
          />
          {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
        </div>

        <div>
          <label className="label">Mesazhi (HTML lejohet)</label>
          <textarea
            className="input resize-none h-48"
            {...register('message')}
            placeholder="Shkruani mesazhin e newsletter-it..."
          />
          {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
        </div>

        {!confirming ? (
          <button
            type="button"
            disabled={!subject || !message || selectedCount === 0}
            onClick={() => setConfirming(true)}
            className="btn-primary"
          >
            <Send size={16} />
            Dërgo Newsletter
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-900 flex-1">
              Konfirmo: dërgo tek {selectedCount} {selectedCount === 1 ? 'marrës' : 'marrës'}? Kjo s&apos;mund të anulohet.
            </p>
            <button type="button" onClick={() => setConfirming(false)} className="btn-secondary py-2 px-3 text-sm">
              Anulo
            </button>
            <button type="button" disabled={sending} onClick={handleSend} className="btn-primary py-2 px-3 text-sm">
              {sending ? 'Duke dërguar...' : 'Po, dërgo'}
            </button>
          </div>
        )}
      </div>
      </div>

      <Dialog modal open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historia e newsletter-ave</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            {campaigns.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">
                Nuk ka newsletter të dërguar ende.
              </p>
            ) : (
              campaigns.map(item => (
                <article key={item.id} className="rounded-xl border border-surface-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold text-sm text-text-primary">{item.subject}</h4>
                    <span className="shrink-0 text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                      {item.audience_count} {item.audience_count === 1 ? 'marrës' : 'marrës'}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {campaignText(item.message) || '—'}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {new Date(item.sent_at).toLocaleString('sq-AL')}
                  </p>
                </article>
              ))
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}
