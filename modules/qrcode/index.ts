// =====================================================
// QR CODE MODULE
// Geração de QR Codes para cardápio digital
// =====================================================

import type { Tenant } from '@/types/database'

/**
 * Gera URL do cardápio público
 */
export function getCardapioUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cardapiodigital.com.br'
  return `${base}/r/${slug}`
}

/**
 * Gera URL do Monte sua Pizza
 */
export function getMontePizzaUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cardapiodigital.com.br'
  return `${base}/r/${slug}/monte-sua-pizza`
}

/**
 * Opções para geração de QR Code
 */
export interface QRCodeOptions {
  size?: number
  color?: string
  backgroundColor?: string
  logoUrl?: string
  logoSize?: number
  errorCorrection?: 'L' | 'M' | 'Q' | 'H'
  format?: 'png' | 'svg'
}

/**
 * Gera URL para API de QR Code (usando serviço gratuito)
 * Alternativas: qrcode.show, api.qrserver.com, quickchart.io
 */
export function generateQRCodeUrl(data: string, options: QRCodeOptions = {}): string {
  const {
    size = 300,
    color = '000000',
    backgroundColor = 'FFFFFF',
    errorCorrection = 'M',
    format = 'png',
  } = options

  // Usando api.qrserver.com (gratuito, sem limite)
  const params = new URLSearchParams({
    data: data,
    size: `${size}x${size}`,
    color: color,
    bgcolor: backgroundColor,
    ecc: errorCorrection,
    format: format,
  })

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`
}

/**
 * Gera URL alternativa via QuickChart (suporta logo)
 */
export function generateQRCodeWithLogo(data: string, options: QRCodeOptions = {}): string {
  const {
    size = 300,
    color = '#000000',
    backgroundColor = '#FFFFFF',
    logoUrl,
    errorCorrection = 'M',
  } = options

  const config = {
    type: 'qr',
    data: data,
    size: size,
    margin: 2,
    ecLevel: errorCorrection,
    dark: color,
    light: backgroundColor,
    ...(logoUrl && {
      imageOptions: {
        src: logoUrl,
        size: 0.25, // 25% do QR
      },
    }),
  }

  const encodedConfig = encodeURIComponent(JSON.stringify(config))
  return `https://quickchart.io/qr?${encodedConfig}`
}

/**
 * Dados do QR Code para download
 */
export interface QRCodeData {
  url: string
  cardapioUrl: string
  tenant: Pick<Tenant, 'nome' | 'slug' | 'logo_url' | 'cores'>
}

/**
 * Gera todos os dados necessários para QR Code da pizzaria
 */
export function generateTenantQRCode(
  tenant: Pick<Tenant, 'nome' | 'slug' | 'logo_url' | 'cores'>,
  options?: QRCodeOptions
): QRCodeData {
  const cardapioUrl = getCardapioUrl(tenant.slug)
  const color = tenant.cores?.primary?.replace('#', '') || 'E53E3E'

  const qrUrl = generateQRCodeUrl(cardapioUrl, {
    size: options?.size || 400,
    color: color,
    backgroundColor: options?.backgroundColor || 'FFFFFF',
    errorCorrection: options?.errorCorrection || 'H',
    format: options?.format || 'png',
    ...options,
  })

  return {
    url: qrUrl,
    cardapioUrl,
    tenant,
  }
}

/**
 * Template HTML para impressão do QR Code
 */
export function generatePrintTemplate(data: QRCodeData): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code - ${data.tenant.nome}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      max-width: 350px;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      border-radius: 50%;
      object-fit: cover;
    }
    h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 10px;
    }
    .qr-code {
      margin: 20px 0;
    }
    .qr-code img {
      width: 200px;
      height: 200px;
    }
    .instruction {
      font-size: 16px;
      color: #666;
      margin-bottom: 20px;
    }
    .url {
      font-size: 12px;
      color: #999;
      word-break: break-all;
    }
    .footer {
      margin-top: 20px;
      font-size: 11px;
      color: #bbb;
    }
    @media print {
      body {
        background: white;
      }
      .card {
        box-shadow: none;
        border: 1px solid #eee;
      }
    }
  </style>
</head>
<body>
  <div class="card">
    ${data.tenant.logo_url ? `<img src="${data.tenant.logo_url}" alt="${data.tenant.nome}" class="logo">` : ''}
    <h1>${data.tenant.nome}</h1>
    <p class="instruction">📱 Aponte a câmera do celular<br>para ver nosso cardápio</p>
    <div class="qr-code">
      <img src="${data.url}" alt="QR Code">
    </div>
    <p class="url">${data.cardapioUrl}</p>
    <p class="footer">Powered by CardápioDigital</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Template para mesa (formato menor)
 */
export function generateTableTemplate(data: QRCodeData, tableNumber?: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Mesa ${tableNumber || ''} - ${data.tenant.nome}</title>
  <style>
    body {
      font-family: sans-serif;
      display: flex;
      justify-content: center;
      margin: 20px;
    }
    .card {
      text-align: center;
      padding: 15px;
      border: 2px solid ${data.tenant.cores?.primary || '#E53E3E'};
      border-radius: 15px;
      width: 120mm;
    }
    h2 { font-size: 16px; color: #333; }
    .qr img { width: 100px; height: 100px; }
    .mesa { 
      font-size: 32px; 
      font-weight: bold;
      color: ${data.tenant.cores?.primary || '#E53E3E'};
      margin: 10px 0;
    }
    p { font-size: 11px; color: #666; }
  </style>
</head>
<body>
  <div class="card">
    <h2>${data.tenant.nome}</h2>
    ${tableNumber ? `<div class="mesa">Mesa ${tableNumber}</div>` : ''}
    <div class="qr">
      <img src="${data.url}" alt="QR Code">
    </div>
    <p>Escaneie para fazer seu pedido</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Faz download do QR Code como imagem
 */
export async function downloadQRCode(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Erro ao fazer download do QR Code:', error)
    throw error
  }
}
