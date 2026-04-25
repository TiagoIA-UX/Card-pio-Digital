const path = require('path');
require('dotenv').config({ path: path.resolve('.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paymentId = '1326999922';

(async () => {
  const eventId = `payment_${paymentId}_payment.created`;
  const endpoint = `${url}/rest/v1/webhook_events?select=event_id,status,error_message,created_at,payload&event_id=eq.${encodeURIComponent(eventId)}`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  });
  const rows = await res.json();
  console.log(JSON.stringify({ eventId, row: rows?.[0] || null }, null, 2));
})();
