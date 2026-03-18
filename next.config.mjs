const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: '**.r2.dev',
    pathname: '/**',
  },
]

const r2PublicUrl = process.env.R2_PUBLIC_URL?.trim()
if (r2PublicUrl) {
  try {
    const parsed = new URL(r2PublicUrl)
    remotePatterns.push({
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      pathname: '/**',
    })
  } catch {
    console.warn('[next.config] R2_PUBLIC_URL inválida para images.remotePatterns')
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://va.vercel-scripts.com https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://images.unsplash.com https://*.r2.dev https://*.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://cdn.vercel-insights.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
              "frame-src 'self' https://www.mercadopago.com.br https://vercel.live",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/google1a0b3e572aae5f34.html',
        destination: '/api/google-verification',
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/checkout',
        destination: '/templates',
        permanent: true,
      },
      {
        source: '/checkout-novo',
        destination: '/templates',
        permanent: true,
      },
      {
        source: '/finalizar-compra',
        destination: '/templates',
        permanent: true,
      },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns,
  },
}

export default nextConfig
