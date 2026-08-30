'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Droplets, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { materialOptionLabel } from '@/lib/lease/sync-material'
import { recordRefillAction } from '@/lib/actions/refills'
import type { ContractDeviceChoice } from '@/lib/lease/contract-activity'

export function ContractRefillCard({
  devices,
  materials,
}: {
  devices: ContractDeviceChoice[]
  materials: Array<{ id: string; name_sq: string; unit: string; sku?: string; is_active?: boolean }>
}) {
  const router = useRouter()
  const [deviceId, setDeviceId] = useState(devices[0]?.id ?? '')
  const [materialId, setMaterialId] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const selected = devices.find(d => d.id === deviceId)
  const materialOptions = useMemo(() => {
    const source = selected?.materials.length ? selected.materials : materials
    return source.map(m => ({
      value: m.id,
      label: materialOptionLabel(m.name_sq, m.unit, true, m.sku),
    }))
  }, [selected, materials])

  const handleRefill = async () => {
    if (!deviceId || !materialId || !amount) {
      toast.error('Zgjidhni pajisjen, materialin dhe sasinë')
      return
    }
    const parsed = parseFloat(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Sasia duhet të jetë më e madhe se 0')
      return
    }
    setLoading(true)
    const capacity = selected?.materials.find(m => m.id === materialId)?.capacity
    const result = await recordRefillAction({
      deployed_device_id: deviceId,
      material_id: materialId,
      amount: parsed,
      capacity: capacity && capacity > 0 ? capacity : null,
    })
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Rimbushja u regjistrua')
    setAmount('')
    router.refresh()
  }

  if (devices.length === 0) return null

  return (
    <div className="admin-card space-y-4">
      <div className="flex items-center gap-2">
        <Droplets size={16} className="text-brand-600" />
        <h3 className="admin-section-title">Rimbushje</h3>
      </div>
      <div className="grid sm:grid-cols-[1.2fr_1fr_120px_auto] gap-3 items-end">
        <div>
          <label className="label">Pajisja</label>
          <SearchableSelect
            value={deviceId}
            onChange={id => {
              setDeviceId(id)
              setMaterialId('')
            }}
            options={devices.map(d => ({ value: d.id, label: d.label }))}
            placeholder="Zgjedh pajisjen..."
            searchPlaceholder="Kërko pajisjen..."
          />
        </div>
        <div>
          <label className="label">Materiali</label>
          <SearchableSelect
            value={materialId}
            onChange={setMaterialId}
            options={materialOptions}
            searchType="materials"
            placeholder="Zgjedh materialin..."
            searchPlaceholder="Kërko materialin..."
          />
        </div>
        <div>
          <label className="label">Sasia</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="input"
            placeholder="ml"
          />
        </div>
        <button type="button" disabled={loading} onClick={handleRefill} className="btn-primary text-sm py-2.5 px-4 gap-2">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Droplets size={15} />}
          Regjistro
        </button>
      </div>
    </div>
  )
}
