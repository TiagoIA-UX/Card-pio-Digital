const path = require('path');
require('dotenv').config({ path: path.resolve('.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

(async () => {
  const endpoint = `${url}/rest/v1/system_alerts?select=id,created_at,severity,channel,title,body,metadata&channel=eq.payment&order=created_at.desc&limit=10`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  });
  const json = await res.json();
  const hit = (json || []).find((row) => String(row?.body || '').includes('155363489509'));
  console.log(JSON.stringify(hit || { notFound: true, total: (json || []).length }, null, 2));
})();
