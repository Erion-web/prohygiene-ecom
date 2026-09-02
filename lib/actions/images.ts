'use server'

import { requireAdmin } from '@/lib/admin/require-admin'
import { createServiceClient } from '@/lib/supabase/server'
import { actionError, type ActionResult } from '@/lib/actions/types'
import {
  ALLOWED_IMAGE_TYPES,
  destroyCloudinaryImage,
  isCloudinaryUrl,
  isImageFolder,
  MAX_IMAGE_BYTES,
  supabaseStoragePathFromUrl,
  uploadImageBuffer,
} from '@/lib/cloudinary'

export async function uploadImageAction(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const { authorized } = await requireAdmin()
  if (!authorized) return actionError('Forbidden')

  const file = formData.get('file')
  const folder = formData.get('folder')
  if (!(file instanceof File)) return actionError('Nuk u gjet asnjë imazh')
  if (typeof folder !== 'string' || !isImageFolder(folder)) {
    return actionError('Folder i pavlefshëm')
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return actionError('Vetëm PNG, JPG, WebP')
  if (file.size > MAX_IMAGE_BYTES) return actionError('Imazhi është shumë i madh (maks. 6MB)')

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImageBuffer(buffer, folder)
    if (!result.secure_url) return actionError('Ngarkimi dështoi')
    return { ok: true, data: { url: result.secure_url } }
  } catch (err) {
    console.error('[uploadImage]', err)
    return actionError('Ngarkimi dështoi')
  }
}

export async function deleteStoredImageAction(url: string): Promise<ActionResult> {
  const { authorized } = await requireAdmin()
  if (!authorized) return actionError('Forbidden')
  if (!url) return { ok: true, data: undefined }

  try {
    if (isCloudinaryUrl(url)) {
      await destroyCloudinaryImage(url)
    } else {
      const stored = supabaseStoragePathFromUrl(url)
      if (stored) {
        const supabase = await createServiceClient()
        await supabase.storage.from(stored.bucket).remove([stored.path])
      }
    }
    return { ok: true, data: undefined }
  } catch (err) {
    console.error('[deleteStoredImage]', err)
    return actionError('Fshirja dështoi')
  }
}
