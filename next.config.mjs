import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production'

const nextConfig = {
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live https://*.mercadopago.com https://*.mlstatic.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://*.supabase.co https://*.r2.dev https://cdn.zairyx.com.br https://cdn.zairyx.com https://images.unsplash.com https://images.pexels.com https://api.qrserver.com https://quickchart.io",
          "connect-src 'self' https://*.supabase.co https://api.mercadopago.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ]

    if (isProduction) {
      securityHeaders.splice(3, 0, {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      })
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/google1a0b3e572aae5f34.html',
        destination: '/api/google-verification',
      },
      {
        source: '/google97080e0a7b8aa4f2.html',
        destination: '/api/google-verification-2',
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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.zairyx.com.br',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.zairyx.com',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['canvas', 'puppeteer', 'sharp'],
}

const sentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN)

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      silent: true,
      disableLogger: true,
      telemetry: false,
    })
  : nextConfig
