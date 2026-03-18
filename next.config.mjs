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
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
