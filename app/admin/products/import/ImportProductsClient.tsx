'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2,
  Download, AlertCircle, ArrowRight, Info,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import type { ImportResult } from '@/types'

// Same mapping as the server — tells the user what we detect
const KNOWN_COLUMNS: Record<string, string> = {
  'Shifra':             'SKU / Kodi',
  'Emertimi':           'Emri (Shqip)',
  'Njesia Matese Baze': 'Njësia',
  'Cmimi me TVSH':      'Çmimi',
  'name_en':            'Emri (Anglisht)',
  'description_sq':     'Përshkrimi',
  'category':           'Kategoria (slug)',
  'audience_type':      'Audienca',
  'stock':              'Sasia',
  'image_url':          'URL e Imazhit',
}

function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = e.target?.result as ArrayBuffer
        resolve(XLSX.read(data, { type: 'array', cellDates: true }))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

export function ImportProductsClient() {
  const [file, setFile]       = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<ImportResult | null>(null)
  const [totalRows, setTotalRows] = useState(0)

  const onDrop = useCallback(async (files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setPreview([])
    setHeaders([])

    try {
      const wb = await readWorkbook(f)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

      setTotalRows(rows.length)
      const hs = rows.length > 0 ? Object.keys(rows[0]) : []
      setHeaders(hs)
      setPreview(
        rows.slice(0, 6).map(row =>
          Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v)]))
        )
      )
    } catch {
      toast.error('Skedari nuk mund të lexohet. Sigurohuni se është .xlsx ose .csv')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  })

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        // Show the actual server error (DB missing, env vars, etc.)
        toast.error(data.error ?? 'Import dështoi', { duration: 8000 })
        setLoading(false)
        return
      }
      setResult(data)
      if (data.success > 0) {
        toast.success(`${data.success} produkte u importuan!`)
      } else {
        toast.error('Asnjë produkt nuk u importua. Shiko gabimet më poshtë.', { duration: 6000 })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import dështoi')
    } finally {
      setLoading(false)
    }
  }

  const detectedCols = headers.map(h => ({
    original: h,
    mapped: KNOWN_COLUMNS[h] ?? KNOWN_COLUMNS[h.toLowerCase()] ?? '—',
    recognized: !!(KNOWN_COLUMNS[h] ?? KNOWN_COLUMNS[h.toLowerCase()]),
  }))

  return (
    <div className="max-w-4xl space-y-6">

      {/* Format explanation */}
      <div className="admin-card p-5">
        <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
          <Info size={16} className="text-brand-500" />
          Formati i Skedarit
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Sistemi njeh automatikisht kolonat e Excel-it tuaj. Emrat e kolonave të pranuara:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(KNOWN_COLUMNS).map(([col, label]) => (
            <div key={col} className="flex items-center gap-2 text-sm">
              <ArrowRight size={12} className="text-brand-400 flex-shrink-0" />
              <code className="font-mono text-[12px] bg-surface-muted px-2 py-0.5 rounded text-brand-700">{col}</code>
              <span className="text-text-muted">→ {label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
          <strong>Shënim:</strong> Rreshtat me çmim 0 anashkalohen automatikisht. SKU gjenerohet nga <code>Shifra</code>. Emri anglisht kopjohet nga shqipja nëse mungon.
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'admin-card p-10 text-center cursor-pointer border-2 border-dashed transition-all duration-200',
          isDragActive
            ? 'border-brand-400 bg-brand-50'
            : 'border-surface-border hover:border-brand-300 hover:bg-surface-soft'
        )}
      >
        <input {...getInputProps()} />
        <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-4">
          {file
            ? <FileSpreadsheet size={28} className="text-brand-600" />
            : <Upload size={28} className="text-text-muted" />
          }
        </div>
        {file ? (
          <div>
            <p className="font-semibold text-text-primary">{file.name}</p>
            <p className="text-text-muted text-sm mt-1">
              {(file.size / 1024).toFixed(1)} KB — {totalRows} rreshta gjithsej
            </p>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-text-primary mb-1">
              {isDragActive ? 'Lëshoni skedarin këtu' : 'Tërhiqni skedarin Excel / CSV'}
            </p>
            <p className="text-text-muted text-sm">.xlsx, .xls, .csv — ose klikoni për të zgjedhur</p>
          </div>
        )}
      </div>

      {/* Column detection panel */}
      {headers.length > 0 && (
        <div className="admin-card p-5">
          <h3 className="font-bold text-text-primary text-sm mb-3">
            Kolonat e Zbuluara
          </h3>
          <div className="flex flex-wrap gap-2">
            {detectedCols.map(({ original, mapped, recognized }) => (
              <div
                key={original}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border',
                  recognized
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-surface-muted border-surface-border text-text-muted'
                )}
              >
                {recognized
                  ? <CheckCircle size={11} className="text-emerald-500" />
                  : <AlertCircle size={11} className="text-text-muted" />
                }
                <span className="font-mono">{original}</span>
                {recognized && <span className="text-emerald-600">→ {mapped}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="admin-card overflow-hidden p-0">
          <div className="px-5 py-3 border-b border-surface-border">
            <h3 className="font-bold text-text-primary text-sm">
              Pamja Paraprake — {Math.min(6, preview.length)} nga {totalRows} rreshta
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-soft border-b border-surface-border">
                  {headers.map(h => (
                    <th key={h} className="text-left font-semibold text-text-secondary px-4 py-2.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-surface-border/50 hover:bg-surface-soft">
                    {headers.map(h => (
                      <td key={h} className="px-4 py-2.5 max-w-48 truncate text-text-primary">
                        {row[h] || <span className="text-text-muted">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import button */}
      {file && !result && (
        <button
          onClick={handleImport}
          disabled={loading}
          className="btn-primary py-3 px-8 gap-2 text-base"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Duke importuar {totalRows} rreshta...</>
            : <><Upload size={16} /> Importo {totalRows} Produkte</>
          }
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="admin-card p-5 space-y-4">
          <h3 className="font-bold text-text-primary">Rezultati i Importit</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <CheckCircle size={24} className="text-emerald-500" />
              <div>
                <p className="text-2xl font-black text-emerald-700">{result.success}</p>
                <p className="text-sm text-emerald-600">Importuar me sukses</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-red-50 rounded-xl p-4 border border-red-100">
              <XCircle size={24} className="text-red-400" />
              <div>
                <p className="text-2xl font-black text-red-600">{result.failed}</p>
                <p className="text-sm text-red-500">Anashkaluar / Gabime</p>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="border border-surface-border rounded-xl overflow-hidden">
              <div className="bg-surface-soft px-4 py-3 border-b border-surface-border">
                <p className="text-sm font-semibold text-text-primary">
                  Detaje — {result.errors.length} probleme
                </p>
                {result.success === 0 && result.errors[0] && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    Gabimi i parë: {result.errors[0].error}
                  </p>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-surface-border/50">
                {result.errors.map((e, i) => (
                  <div key={i} className="px-4 py-2 flex items-start gap-3 text-xs">
                    <span className="text-text-muted w-16 flex-shrink-0">Rr. {e.row}</span>
                    <span className="font-mono text-brand-600 flex-shrink-0">{e.sku}</span>
                    <span className="text-text-secondary">{e.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { setFile(null); setPreview([]); setResult(null); setHeaders([]); setTotalRows(0) }}
            className="btn-secondary text-sm py-2"
          >
            Importo Skedar Tjetër
          </button>
        </div>
      )}
    </div>
  )
}
