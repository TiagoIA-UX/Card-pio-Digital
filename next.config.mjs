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
