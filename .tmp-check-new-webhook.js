const path = require('path');
require('dotenv').config({ path: path.resolve('.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

(async () => {
  const endpoint = `${url}/rest/v1/webhook_events?select=event_id,event_type,status,error_message,created_at,payload&event_type=eq.payment&order=created_at.desc&limit=5`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  });
  const rows = await res.json();
  const filtered = (rows || []).filter((r) => JSON.stringify(r.payload || {}).includes('156121425660'));
  console.log(JSON.stringify({ found: filtered.length, rows: filtered }, null, 2));
})();
