const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve('.env.local') });

const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !url || !key) {
  console.error('Env ausente para validação');
  process.exit(1);
}

async function createPix(externalReference) {
  const payload = {
    transaction_amount: 1.0,
    description: `Webhook validation ${externalReference}`,
    payment_method_id: 'pix',
    external_reference: externalReference,
    notification_url: 'https://zairyx.com.br/api/webhook/mercadopago',
    payer: { email: `pagador+${Date.now()}@zairyx.com.br` },
  };

  const res = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(`create_pix_failed:${res.status}:${JSON.stringify(body)}`);
  }

  return {
    id: String(body.id),
    external_reference: body.external_reference,
    status: body.status,
  };
}

async function getWebhookEvent(paymentId) {
  const eventId = `payment_${paymentId}_payment.created`;
  const endpoint = `${url}/rest/v1/webhook_events?select=event_id,status,error_message,created_at,payload&event_id=eq.${encodeURIComponent(eventId)}`;

  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  });

  const rows = await res.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  return {
    event_id: eventId,
    found: !!row,
    status: row?.status || null,
    error_message: row?.error_message || null,
    created_at: row?.created_at || null,
  };
}

(async () => {
  const refText = `real-pix-direct-${Date.now()}`;
  const refUuid = crypto.randomUUID();

  const paymentText = await createPix(refText);
  const paymentUuid = await createPix(refUuid);

  const webhookText = await getWebhookEvent(paymentText.id);
  const webhookUuid = await getWebhookEvent(paymentUuid.id);

  console.log(JSON.stringify({
    created: {
      non_uuid: paymentText,
      uuid: paymentUuid,
    },
    webhook_check: {
      non_uuid: webhookText,
      uuid: webhookUuid,
    },
  }, null, 2));
})();
