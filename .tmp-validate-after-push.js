const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve('.env.local') });

const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createPix(externalReference) {
  const payload = {
    transaction_amount: 1.0,
    description: 'Post-deploy webhook validation',
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
  if (!res.ok) throw new Error(JSON.stringify(body));
  return String(body.id);
}

async function readWebhook(paymentId) {
  const eventId = `payment_${paymentId}_payment.created`;
  const endpoint = `${url}/rest/v1/webhook_events?select=event_id,status,error_message,created_at&event_id=eq.${encodeURIComponent(eventId)}`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  });
  const rows = await res.json();
  return { paymentId, event: rows?.[0] || null };
}

(async () => {
  const paymentId = await createPix(`real-pix-direct-${Date.now()}`);
  const result = await readWebhook(paymentId);
  console.log(JSON.stringify(result, null, 2));
})();
