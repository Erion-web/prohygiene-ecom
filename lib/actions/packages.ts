'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { saveHomepagePackageSchema, type SaveHomepagePackageInput } from '@/lib/validation/admin-schemas'
import { actionError, type ActionResult } from '@/lib/actions/types'

function revalidatePackages() {
  revalidatePath('/admin/banners')
  revalidatePath('/')
  revalidateTag('catalog', 'max')
}

export async function saveHomepagePackageAction(
  raw: SaveHomepagePackageInput
): Promise<ActionResult<{ id: string }>> {
  const { authorized } = await requireAdmin()
  if (!authorized) return actionError('Forbidden')

  const parsed = saveHomepagePackageSchema.safeParse(raw)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Të dhëna të pavlefshme')
  }

  const supabase = await createServiceClient()
  const { audience, image_url } = parsed.data

  const { data: existing, error: lookupError } = await supabase
    .from('homepage_packages')
    .select('id')
    .eq('audience', audience)
    .maybeSingle()

  if (lookupError) {
    console.error('[saveHomepagePackage] lookup failed', lookupError)
    return actionError('Gabim gjatë ruajtjes së imazhit')
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('homepage_packages')
      .update({ image_url, is_active: true })
      .eq('id', existing.id)
    if (error) {
      console.error('[saveHomepagePackage] update failed', error)
      return actionError('Gabim gjatë ruajtjes së imazhit')
    }
    revalidatePackages()
    return { ok: true, data: { id: existing.id } }
  }

  const titles: Record<typeof audience, string> = {
    home: 'Paketa Shtëpie',
    office: 'Paketa Zyre',
    horeca: 'Paketa HORECA',
  }

  let insert = await supabase
    .from('homepage_packages')
    .insert({
      audience,
      image_url,
      is_active: true,
      title_sq: titles[audience],
      title_en: titles[audience],
    })
    .select('id')
    .single()

  if (insert.error && /title_sq|PGRST204/i.test(insert.error.message + (insert.error.code ?? ''))) {
    insert = await supabase
      .from('homepage_packages')
      .insert({ audience, image_url, is_active: true })
      .select('id')
      .single()
  }

  if (insert.error || !insert.data) {
    console.error('[saveHomepagePackage] insert failed', insert.error)
    return actionError('Gabim gjatë ruajtjes së imazhit')
  }

  revalidatePackages()
  return { ok: true, data: { id: insert.data.id } }
}

export async function deleteHomepagePackageAction(id: string): Promise<ActionResult> {
  const { authorized } = await requireAdmin()
  if (!authorized) return actionError('Forbidden')

  const supabase = await createServiceClient()
  const { error } = await supabase.from('homepage_packages').delete().eq('id', id)
  if (error) {
    console.error('[deleteHomepagePackage] failed', error)
    return actionError('Gabim gjatë fshirjes')
  }

  revalidatePackages()
  return { ok: true, data: undefined }
}
