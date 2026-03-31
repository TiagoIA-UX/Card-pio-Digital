/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Domínios de parceiros autorizados a embedar o gerador de imagens em iframe
    const PARTNER_DOMAINS = [
      // Adicione aqui os domínios dos seus parceiros co-branded
      // 'https://meusite-parceiro.com.br',
    ]
    const frameAncestors =
      PARTNER_DOMAINS.length > 0 ? `'self' ${PARTNER_DOMAINS.join(' ')}` : "'self'"

    return [
      // Regra geral: bloqueia iframe em todo o site
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.mercadopago.com https://*.mlstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://image.pollinations.ai https://images.pexels.com",
              "connect-src 'self' https://*.supabase.co https://api.mercadopago.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Exceção: páginas co-branded podem ser embeddadas pelos domínios parceiros
      {
        source: '/gerador-imagens/p/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.mercadopago.com https://*.mlstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://image.pollinations.ai",
              "connect-src 'self' https://*.supabase.co https://api.mercadopago.com",
              `frame-ancestors ${frameAncestors}`,
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
