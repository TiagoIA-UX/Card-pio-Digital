const path = require('path');
require('dotenv').config({ path: path.resolve('.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE env ausente');
  process.exit(1);
}

const eventId = 'payment_155363489509_payment.created';
const endpoint = `${url}/rest/v1/mercadopago_webhook_events?select=event_id,status,error_message,attempt_count,updated_at,payload&id=eq.${encodeURIComponent(eventId)}`;

(async () => {
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  });

  const text = await res.text();
  console.log('status', res.status);
  console.log(text);
})();
