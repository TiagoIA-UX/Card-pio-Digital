import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/shared/site-url'

export const metadata: Metadata = {
  title: 'Termos de Uso | Zairyx',
  alternates: { canonical: `${getSiteUrl()}/termos` },
}

export { default } from '@/app/termos/page'
