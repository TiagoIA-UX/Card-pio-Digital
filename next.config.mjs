/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
}

export default nextConfig
