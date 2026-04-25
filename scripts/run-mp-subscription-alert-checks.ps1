param(
    [ValidateSet('summary', 'failed-events', 'missing-status', 'isolated-payments', 'validation-errors', 'missing-subscriptions', 'contract-hash-errors', 'regressions', 'phase4-gate', 'all')]
    [string]$Check = 'summary',

    [switch]$List,

    [switch]$PrintOnly
)

$queries = [ordered]@{
    'summary'               = @"
SELECT
  status,
  COUNT(*) AS total
FROM public.webhook_events
WHERE provider = 'mercadopago_subscription'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY status;
"@
    'failed-events'         = @"
SELECT
  created_at,
  event_id,
  event_type,
  resource_id,
  resource_type,
  status,
  ignored_reason,
  LEFT(COALESCE(error_message, ''), 240) AS error_message,
  processed_at
FROM public.webhook_events
WHERE provider = 'mercadopago_subscription'
  AND status = 'failed'
ORDER BY created_at DESC
LIMIT 50;
"@
    'missing-status'        = @"
SELECT
  created_at,
  event_id,
  event_type,
  resource_id,
  status,
  processed_at
FROM public.webhook_events
WHERE provider = 'mercadopago_subscription'
  AND (status IS NULL OR (status IN ('processed', 'skipped', 'failed') AND processed_at IS NULL))
ORDER BY created_at DESC;
"@
    'isolated-payments'     = @"
SELECT
  created_at,
  event_id,
  event_type,
  resource_id,
  resource_type,
  status,
  ignored_reason,
  processed_at
FROM public.webhook_events
WHERE provider = 'mercadopago_subscription'
  AND event_type = 'subscription_authorized_payment'
ORDER BY created_at DESC
LIMIT 50;
"@
    'validation-errors'     = @"
SELECT
  updated_at,
  mp_preapproval_id,
  status,
  contracted_monthly_amount,
  last_value_validation_error,
  last_value_validated_at,
  last_event_id,
  last_event_status,
  last_event_status_rank
FROM public.subscriptions
WHERE last_value_validation_error IS NOT NULL
ORDER BY updated_at DESC
LIMIT 50;
"@
    'missing-subscriptions' = @"
SELECT
  created_at,
  event_id,
  event_type,
  resource_id,
  status,
  LEFT(COALESCE(error_message, ''), 240) AS error_message
FROM public.webhook_events
WHERE provider = 'mercadopago_subscription'
  AND status = 'failed'
  AND error_message ILIKE '%subscription_not_found%'
ORDER BY created_at DESC
LIMIT 50;
"@
    'contract-hash-errors'  = @"
SELECT
  created_at,
  event_id,
  event_type,
  resource_id,
  status,
  LEFT(COALESCE(error_message, ''), 240) AS error_message
FROM public.webhook_events
WHERE provider = 'mercadopago_subscription'
  AND status = 'failed'
  AND error_message ILIKE '%contract_hash_mismatch%'
ORDER BY created_at DESC
LIMIT 50;
"@
    'regressions'           = @"
SELECT
  created_at,
  event_id,
  event_type,
  resource_id,
  status,
  ignored_reason,
  processed_at
FROM public.webhook_events
WHERE provider = 'mercadopago_subscription'
  AND ignored_reason = 'out_of_order_state_regression'
ORDER BY created_at DESC
LIMIT 50;
"@
    'phase4-gate'           = @"
WITH event_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_24h,
    COUNT(*) FILTER (WHERE ignored_reason = 'out_of_order_state_regression') AS regressions_blocked_24h,
    COUNT(*) FILTER (
      WHERE event_type = 'subscription_authorized_payment'
        AND status <> 'skipped'
    ) AS isolated_payment_not_skipped_24h,
    COUNT(*) FILTER (
      WHERE status IS NULL
        OR (status IN ('processed', 'skipped', 'failed') AND processed_at IS NULL)
    ) AS incomplete_events_24h
  FROM public.webhook_events
  WHERE provider = 'mercadopago_subscription'
    AND created_at >= NOW() - INTERVAL '24 hours'
),
subscription_stats AS (
  SELECT
    COUNT(*) FILTER (
      WHERE last_value_validation_error IS NOT NULL
        AND updated_at >= NOW() - INTERVAL '24 hours'
    ) AS validation_errors_24h,
    COUNT(*) FILTER (
      WHERE status = 'active'
        AND last_event_status_rank = 5
        AND updated_at >= NOW() - INTERVAL '24 hours'
    ) AS active_promotions_24h,
    COUNT(*) FILTER (
      WHERE last_event_status_rank < 0
    ) AS invalid_negative_rank
  FROM public.subscriptions
)
SELECT *
FROM event_stats, subscription_stats;
"@
}

if ($List) {
    $queries.Keys | ForEach-Object { Write-Host $_ }
    exit 0
}

$checkNames = if ($Check -eq 'all') {
    $queries.Keys
}
else {
    @($Check)
}

foreach ($checkName in $checkNames) {
    $sql = $queries[$checkName]
    if (-not $sql) {
        Write-Error "Check desconhecido: $checkName"
        exit 1
    }

    Write-Host ("=" * 72)
    Write-Host "Check: $checkName"
    Write-Host ("=" * 72)

    if ($PrintOnly) {
        Write-Host $sql
        continue
    }

    & "$PSScriptRoot\query-remote-sql.ps1" -Sql $sql
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}