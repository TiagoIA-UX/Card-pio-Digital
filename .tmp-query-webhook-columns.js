const path = require('path');
require('dotenv').config({ path: path.resolve('.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

(async () => {
  const endpoint = `${url}/rest/v1/webhook_events?select=*&limit=1`;
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
