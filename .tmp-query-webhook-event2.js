const path = require('path');
require('dotenv').config({ path: path.resolve('.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const eventId = 'payment_155363489509_payment.created';

(async () => {
  const endpoint = `${url}/rest/v1/webhook_events?select=event_id,event_type,status,error_message,attempt_count,updated_at,payload&id=eq.${encodeURIComponent(eventId)}`;
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
