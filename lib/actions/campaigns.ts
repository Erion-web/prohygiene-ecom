'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { saveCampaignSchema, type SaveCampaignInput } from '@/lib/validation/admin-schemas'
import { actionError, type ActionResult } from '@/lib/actions/types'

export async function saveCampaignAction(raw: SaveCampaignInput): Promise<ActionResult<{ id: string }>> {
  const { authorized } = await requireAdmin()
  if (!authorized) return actionError('Forbidden')

  const parsed = saveCampaignSchema.safeParse(raw)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Invalid campaign data')
  }

  const input = parsed.data
  const supabase = await createServiceClient()

  const payload = {
    title_sq: input.title_sq,
    title_en: input.title_en || input.title_sq,
    description_sq: input.description_sq || null,
    description_en: input.description_en || null,
    slug: input.slug,
    discount_type: input.discount_type,
    discount_value: input.discount_value,
    audience_type: input.audience_type,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    is_active: input.is_active,
    show_on_homepage: input.show_on_homepage,
  }

  let campaignId = input.id
  if (campaignId) {
    const { error } = await supabase.from('campaigns').update(payload).eq('id', campaignId)
    if (error) {
      console.error('[saveCampaign] update failed', error)
      return actionError('Failed to save campaign')
    }
  } else {
    const { data, error } = await supabase.from('campaigns').insert(payload).select('id').single()
    if (error || !data) {
      console.error('[saveCampaign] insert failed', error)
      return actionError('Failed to save campaign')
    }
    campaignId = data.id
  }

  if (!campaignId) return actionError('Failed to save campaign')

  const { error: deleteError } = await supabase.from('campaign_products').delete().eq('campaign_id', campaignId)
  if (deleteError) {
    console.error('[saveCampaign] campaign_products delete failed', deleteError)
    return actionError('Failed to save campaign products')
  }

  if (input.product_ids.length > 0) {
    const { error: insertError } = await supabase.from('campaign_products').insert(
      input.product_ids.map(product_id => ({ campaign_id: campaignId, product_id }))
    )
    if (insertError) {
      console.error('[saveCampaign] campaign_products insert failed', insertError)
      return actionError('Failed to save campaign products')
    }
  }

  revalidatePath('/admin/campaigns')
  revalidatePath('/campaigns')
  return { ok: true, data: { id: campaignId } }
}

export async function deleteCampaignAction(id: string): Promise<ActionResult> {
  const { authorized } = await requireAdmin()
  if (!authorized) return actionError('Forbidden')

  const supabase = await createServiceClient()
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) {
    console.error('[deleteCampaign] failed', error)
    return actionError('Failed to delete campaign')
  }

  revalidatePath('/admin/campaigns')
  return { ok: true, data: undefined }
}
