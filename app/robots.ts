import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/order-success/',
          '/order-failed/',
        ],
      },
    ],
    sitemap: 'https://prohygiene.shop/sitemap.xml',
    host: 'https://prohygiene.shop',
  }
}
