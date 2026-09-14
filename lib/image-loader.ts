'use client'

export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  if (src.startsWith('https://res.cloudinary.com/') && src.includes('/image/upload/')) {
    const transform = ['f_auto', 'c_limit', `w_${width}`, `q_${quality ?? 'auto'}`].join(',')
    return src.replace('/image/upload/', `/image/upload/${transform}/`)
  }
  return src
}
