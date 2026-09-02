import { v2 as cloudinary } from 'cloudinary'
import type { UploadApiResponse } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const MAX_IMAGE_BYTES = 6 * 1024 * 1024

export const IMAGE_FOLDERS = ['products', 'banners', 'packages'] as const
export type ImageFolder = (typeof IMAGE_FOLDERS)[number]

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

export function isImageFolder(value: string): value is ImageFolder {
  return (IMAGE_FOLDERS as readonly string[]).includes(value)
}

function assertConfigured() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error('Cloudinary is not configured')
  }
}

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: ImageFolder
): Promise<UploadApiResponse> {
  assertConfigured()
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `prohygiene/${folder}`,
          resource_type: 'image',
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error('Upload failed'))
          else resolve(result)
        }
      )
      .end(buffer)
  })
}

export function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'res.cloudinary.com'
  } catch {
    return false
  }
}

export function cloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url)
    const marker = '/upload/'
    const idx = pathname.indexOf(marker)
    if (idx === -1) return null
    const parts = pathname.slice(idx + marker.length).split('/')
    while (parts.length > 0 && (/^v\d+$/.test(parts[0]) || parts[0].includes(','))) {
      parts.shift()
    }
    if (parts.length === 0) return null
    return parts.join('/').replace(/\.[a-zA-Z0-9]+$/, '')
  } catch {
    return null
  }
}

export async function destroyCloudinaryImage(url: string): Promise<void> {
  const publicId = cloudinaryPublicIdFromUrl(url)
  if (!publicId) return
  assertConfigured()
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}

export function supabaseStoragePathFromUrl(url: string): { bucket: string; path: string } | null {
  try {
    const { pathname } = new URL(url)
    const marker = '/storage/v1/object/public/'
    const idx = pathname.indexOf(marker)
    if (idx === -1) return null
    const rest = pathname.slice(idx + marker.length)
    const slash = rest.indexOf('/')
    if (slash === -1) return null
    return {
      bucket: rest.slice(0, slash),
      path: decodeURIComponent(rest.slice(slash + 1)),
    }
  } catch {
    return null
  }
}
