import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/shared/site-url'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Zairyx',
  alternates: { canonical: `${getSiteUrl()}/privacidade` },
}

export { default } from '@/app/privacidade/page'
