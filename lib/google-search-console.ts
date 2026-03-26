/**
 * Google Search Console API client
 * Uses service account JWT auth — no external dependencies.
 * Docs: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
 */
import { createSign } from 'crypto'

// ─── Config ──────────────────────────────────────────────────
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GSC_API = 'https://www.googleapis.com/webmasters/v3/sites'

// Token cache (reuse until expiry)
let cachedToken: { token: string; expiresAt: number } | null = null

// ─── Types ───────────────────────────────────────────────────
export interface GSCQueryParams {
  siteUrl: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  dimensions?: ('query' | 'page' | 'date' | 'device' | 'country')[]
  rowLimit?: number
  startRow?: number
  type?: 'web' | 'image' | 'video' | 'news' | 'discover' | 'googleNews'
}

export interface GSCRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCResponse {
  rows: GSCRow[]
  responseAggregationType: string
}

export interface GSCOverview {
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  avgPosition: number
  topQueries: GSCRow[]
  topPages: GSCRow[]
  dailyData: GSCRow[]
}

// ─── JWT Builder ─────────────────────────────────────────────
function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf.toString('base64url')
}

function buildJwt(email: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000)

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      iss: email,
      scope: GSC_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  )

  const unsigned = `${header}.${payload}`
  const sign = createSign('RSA-SHA256')
  sign.update(unsigned)
  const signature = sign.sign(privateKey, 'base64url')

  return `${unsigned}.${signature}`
}

// ─── Token Exchange ──────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!email || !rawKey) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
  }

  // Reuse cached token if still valid (with 60s margin)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }

  // Replace literal \n with actual newlines (env vars often escape them)
  const privateKey = rawKey.replace(/\\n/g, '\n')
  const jwt = buildJwt(email, privateKey)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google token exchange failed (${res.status}): ${body}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
  return cachedToken.token
}

// ─── GSC Query ───────────────────────────────────────────────
async function querySearchConsole(params: GSCQueryParams): Promise<GSCResponse> {
  const token = await getAccessToken()
  const encodedSite = encodeURIComponent(params.siteUrl)

  const body: Record<string, unknown> = {
    startDate: params.startDate,
    endDate: params.endDate,
    dimensions: params.dimensions ?? ['query'],
    rowLimit: params.rowLimit ?? 25,
    type: params.type ?? 'web',
  }
  if (params.startRow) body.startRow = params.startRow

  const res = await fetch(`${GSC_API}/${encodedSite}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GSC API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  return { rows: data.rows ?? [], responseAggregationType: data.responseAggregationType ?? '' }
}

// ─── Date Helpers ────────────────────────────────────────────
function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return formatDate(d)
}

// ─── Public API ──────────────────────────────────────────────
export type DateRange = '7d' | '28d' | '3m'

export async function fetchGSCOverview(range: DateRange = '28d'): Promise<GSCOverview> {
  const siteUrl = process.env.GOOGLE_SITE_URL
  if (!siteUrl) throw new Error('Missing GOOGLE_SITE_URL env var')

  const endDate = daysAgo(2) // GSC data is ~2 days behind
  const startDate =
    range === '7d' ? daysAgo(9) : range === '3m' ? daysAgo(92) : daysAgo(30)

  // Fetch all 3 datasets in parallel
  const [queriesRes, pagesRes, dailyRes] = await Promise.all([
    querySearchConsole({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 20,
    }),
    querySearchConsole({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 20,
    }),
    querySearchConsole({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 100,
    }),
  ])

  // Aggregate totals from daily data
  let totalClicks = 0
  let totalImpressions = 0
  let weightedPosition = 0

  for (const row of dailyRes.rows) {
    totalClicks += row.clicks
    totalImpressions += row.impressions
    weightedPosition += row.position * row.impressions
  }

  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0
  const avgPosition = totalImpressions > 0 ? weightedPosition / totalImpressions : 0

  return {
    totalClicks,
    totalImpressions,
    avgCtr,
    avgPosition,
    topQueries: queriesRes.rows,
    topPages: pagesRes.rows,
    dailyData: dailyRes.rows,
  }
}

/**
 * Check if GSC integration is configured
 */
export function isGSCConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
    process.env.GOOGLE_SITE_URL
  )
}
