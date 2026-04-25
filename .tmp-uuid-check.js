const path = require('path');
require('dotenv').config({ path: path.resolve('.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const invalidTenant = 'real-pix-direct-1776975836009';

(async () => {
  const q1 = `${url}/rest/v1/restaurants?select=id,status_pagamento&id=eq.${encodeURIComponent(invalidTenant)}`;
  const r1 = await fetch(q1, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  const t1 = await r1.text();

  const q2 = `${url}/rest/v1/financial_truth_sync_queue`;
  const r2 = await fetch(q2, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      tenant_id: invalidTenant,
      status: 'pending_sync',
      source: 'payment',
      source_id: '155363489509',
      retry_attempts: 1,
      max_attempts: 3,
      next_retry_at: new Date().toISOString(),
      last_attempt_at: new Date().toISOString(),
      last_error: 'debug',
      raw_snapshot: { test: true },
      updated_at: new Date().toISOString(),
    }),
  });
  const t2 = await r2.text();

  console.log(JSON.stringify({
    restaurants_status: r1.status,
    restaurants_body: t1,
    queue_status: r2.status,
    queue_body: t2,
  }, null, 2));
})();
