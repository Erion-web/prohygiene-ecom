'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_SHIPPING_SETTINGS, parseShippingSettings, type ShippingSettings } from './shipping'

export function useShippingSettings(): ShippingSettings {
  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS)

  useEffect(() => {
    let cancelled = false
    createClient()
      .from('app_settings')
      .select('value')
      .eq('key', 'shipping')
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setSettings(parseShippingSettings(data.value))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return settings
}
