param(
    [string[]]$EventIds,
    [string]$ResourceId,
    [int]$Limit = 5,
    [switch]$PrintOnly
)

if (($null -eq $EventIds -or $EventIds.Count -eq 0) -and [string]::IsNullOrWhiteSpace($ResourceId)) {
    Write-Error 'Informe -EventIds ou -ResourceId.'
    exit 1
}

$eventFilter = if ($EventIds -and $EventIds.Count -gt 0) {
    $quoted = $EventIds | ForEach-Object { "'" + ($_ -replace "'", "''") + "'" }
    "event_id IN ($($quoted -join ', '))"
}
else {
    '1=1'
}

$resourceFilter = if (-not [string]::IsNullOrWhiteSpace($ResourceId)) {
    "resource_id = '$(($ResourceId -replace "'", "''"))'"
}
else {
    '1=1'
}

$sql = @"
WITH selected_events AS (
  SELECT
    we.id,
    we.created_at,
    we.event_id,
    we.event_type,
    we.resource_id,
    we.resource_type,
    we.status,
    we.ignored_reason,
    we.error_message,
    we.processed_at,
    we.provider_event_created_at,
    we.applied_at,
    we.payload
  FROM public.webhook_events we
  WHERE we.provider = 'mercadopago_subscription'
    AND $eventFilter
    AND $resourceFilter
  ORDER BY we.created_at DESC
  LIMIT $Limit
)
SELECT
  se.created_at AS webhook_created_at,
  se.event_id,
  se.event_type,
  se.resource_id,
  se.resource_type,
  se.status AS webhook_status,
  se.ignored_reason,
  LEFT(COALESCE(se.error_message, ''), 240) AS error_message,
  se.processed_at,
  se.provider_event_created_at,
  se.applied_at,
  s.id AS subscription_id,
  s.status AS subscription_status,
  s.mp_subscription_status,
  s.last_event_id,
  s.last_event_at,
  s.last_event_status,
  s.last_event_status_rank,
  s.last_value_validation_error,
  s.last_value_validated_at,
  s.contract_hash,
  s.contracted_monthly_amount,
  LEFT(COALESCE(se.payload::text, ''), 600) AS webhook_payload_excerpt,
  LEFT(COALESCE(s.last_event_payload::text, ''), 600) AS subscription_last_event_payload_excerpt
FROM selected_events se
LEFT JOIN public.subscriptions s
  ON s.mp_preapproval_id = se.resource_id
ORDER BY se.created_at DESC;
"@

if ($PrintOnly) {
    Write-Host $sql
    exit 0
}

& "$PSScriptRoot\query-remote-sql.ps1" -Sql $sql
exit $LASTEXITCODE