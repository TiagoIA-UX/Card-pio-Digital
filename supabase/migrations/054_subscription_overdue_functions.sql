-- ===== Funções de Assinaturas Vencidas =====
-- Garante que o cron /api/cron/check-subscriptions encontre as RPCs
-- mesmo quando o SQL legado não foi aplicado manualmente.

CREATE OR REPLACE FUNCTION public.check_overdue_subscriptions()
RETURNS TABLE(
  restaurant_id UUID,
  user_id UUID,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.restaurant_id,
    s.user_id,
    EXTRACT(DAY FROM NOW() - s.current_period_end)::INTEGER AS days_overdue
  FROM public.subscriptions s
  JOIN public.restaurants r ON r.id = s.restaurant_id
  WHERE s.status = 'active'
    AND s.current_period_end < NOW()
    AND COALESCE(r.suspended, false) = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_suspend_overdue_restaurants(days_tolerance INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  suspended_count INTEGER := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT restaurant_id
    FROM public.check_overdue_subscriptions()
    WHERE days_overdue > days_tolerance
  LOOP
    UPDATE public.restaurants
    SET
      suspended = true,
      suspended_reason = 'Inadimplência - Assinatura vencida',
      suspended_at = NOW(),
      ativo = false
    WHERE id = rec.restaurant_id;

    UPDATE public.subscriptions
    SET
      status = 'past_due',
      suspended_at = NOW()
    WHERE restaurant_id = rec.restaurant_id
      AND status = 'active';

    suspended_count := suspended_count + 1;
  END LOOP;

  RETURN suspended_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;