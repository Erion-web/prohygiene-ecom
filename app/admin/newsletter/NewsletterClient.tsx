'use client'

import { useState } from 'react'
import { Send, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface NewsletterClientProps {
  subscriberCount: number
}

export function NewsletterClient({ subscriberCount }: NewsletterClientProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed')
      toast.success(`U dërgua tek ${data.sent} pajtues.`)
      setSubject('')
      setMessage('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dërgimi dështoi.')
    } finally {
      setSending(false)
      setConfirming(false)
    }
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-2 text-sm text-text-secondary bg-surface-soft rounded-xl p-3">
        <Users size={16} className="text-brand-600" />
        Do t&apos;u dërgohet <strong>{subscriberCount}</strong> pajtuesve aktivë.
      </div>

      <div>
        <label className="label">Subjekti</label>
        <input
          type="text"
          className="input"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="p.sh. Ofertë e re -20% në detergjentë"
        />
      </div>

      <div>
        <label className="label">Mesazhi (HTML lejohet)</label>
        <textarea
          className="input resize-none h-48"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Shkruani mesazhin e newsletter-it..."
        />
      </div>

      {!confirming ? (
        <button
          type="button"
          disabled={!subject || !message || subscriberCount === 0}
          onClick={() => setConfirming(true)}
          className="btn-primary"
        >
          <Send size={16} />
          Dërgo Newsletter
        </button>
      ) : (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-900 flex-1">
            Konfirmo: dërgo tek të gjithë {subscriberCount} pajtuesit? Kjo s&apos;mund të anulohet.
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
  )
}
