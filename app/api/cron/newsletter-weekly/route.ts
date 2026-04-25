import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import {
  buildUnsubscribeToken,
  personalizeNewsletter,
  sendEmailWithResend,
} from '@/lib/domains/marketing/newsletter-automation'

const CRON_SECRET = process.env.CRON_SECRET

function isAuthorizedCronRequest(request: NextRequest) {
  if (!CRON_SECRET) return false
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET nao configurado' }, { status: 500 })
  }

  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const now = new Date().toISOString()
  const supabase = createAdminClient()

  const { data: campaign, error: campaignError } = await supabase
    .from('marketing_campaigns')
    .select('id, subject, body_html, body_text, status')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 500 })
  }

  if (!campaign) {
    return NextResponse.json({ ok: true, processed: 0, reason: 'Nenhuma campanha agendada' })
  }

  await supabase
    .from('marketing_campaigns')
    .update({ status: 'running', started_at: now, updated_at: now })
    .eq('id', campaign.id)

  const { data: contacts, error: contactsError } = await supabase
    .from('marketing_contacts')
    .select('id, email, name, unsubscribed_at')
    .is('unsubscribed_at', null)
    .order('created_at', { ascending: true })
    .limit(1000)

  if (contactsError) {
    await supabase
      .from('marketing_campaigns')
      .update({ status: 'failed', finished_at: new Date().toISOString(), updated_at: now })
      .eq('id', campaign.id)
    return NextResponse.json({ error: contactsError.message }, { status: 500 })
  }

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const contact of contacts || []) {
    if (!contact.email) {
      skipped++
      continue
    }

    let unsubscribeToken = ''
    try {
      unsubscribeToken = buildUnsubscribeToken(contact.email)
    } catch (error) {
      failed++
      await supabase.from('marketing_campaign_sends').insert({
        campaign_id: campaign.id,
        contact_id: contact.id,
        email: contact.email,
        status: 'failed',
        error_message: (error as Error).message,
        updated_at: new Date().toISOString(),
      })
      continue
    }

    const personalized = personalizeNewsletter(
      {
        title: 'Newsletter',
        subject: campaign.subject,
        bodyHtml: campaign.body_html,
        bodyText: campaign.body_text,
      },
      { name: contact.name, email: contact.email },
      unsubscribeToken
    )

    const result = await sendEmailWithResend({
      to: contact.email,
      subject: personalized.subject,
      html: personalized.bodyHtml,
      text: personalized.bodyText,
    })

    if (result.ok) {
      sent++
      await supabase.from('marketing_campaign_sends').upsert(
        {
          campaign_id: campaign.id,
          contact_id: contact.id,
          email: contact.email,
          status: 'sent',
          provider_message_id: result.messageId || null,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'campaign_id,contact_id', ignoreDuplicates: false }
      )
    } else {
      failed++
      await supabase.from('marketing_campaign_sends').upsert(
        {
          campaign_id: campaign.id,
          contact_id: contact.id,
          email: contact.email,
          status: 'failed',
          error_message: result.error,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'campaign_id,contact_id', ignoreDuplicates: false }
      )
    }
  }

  const finishedAt = new Date().toISOString()
  const status = failed > 0 && sent === 0 ? 'failed' : 'finished'

  await supabase
    .from('marketing_campaigns')
    .update({
      status,
      finished_at: finishedAt,
      stats: { sent, failed, skipped },
      updated_at: finishedAt,
    })
    .eq('id', campaign.id)

  return NextResponse.json({ ok: true, campaignId: campaign.id, sent, failed, skipped })
}

