const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve('.env.local') });

const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createAndCheck() {
  const externalReference = `real-pix-direct-${Date.now()}`;
  const payload = {
    transaction_amount: 1.0,
    description: 'Second post-deploy validation',
    payment_method_id: 'pix',
    external_reference: externalReference,
    notification_url: 'https://zairyx.com.br/api/webhook/mercadopago',
    payer: { email: `pagador+${Date.now()}@zairyx.com.br` },
  };

  const createRes = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
  });
  const created = await createRes.json();
  const paymentId = String(created.id);
  const eventId = `payment_${paymentId}_payment.created`;

  const endpoint = `${url}/rest/v1/webhook_events?select=event_id,status,error_message,created_at,payload&event_id=eq.${encodeURIComponent(eventId)}`;
  const eventRes = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  });
  const rows = await eventRes.json();

  console.log(JSON.stringify({
    paymentId,
    externalReference,
    createStatus: createRes.status,
    webhookEvent: rows?.[0] || null,
  }, null, 2));
}

createAndCheck().catch((e) => { console.error(String(e)); process.exit(1); });
