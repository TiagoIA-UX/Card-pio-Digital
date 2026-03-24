-- ============================================================
-- 039: Analytics View do Operador
-- View resumida + funções de análise para o painel
-- ============================================================

-- ── View: resumo operacional por restaurante ──────────────
DROP VIEW IF EXISTS public.vw_analytics_operador;

CREATE VIEW public.vw_analytics_operador
WITH (security_invoker = true)
AS
SELECT
    r.id                                                          AS restaurant_id,
    r.user_id,
    COUNT(DISTINCT o.id) FILTER (
        WHERE o.created_at >= NOW() - INTERVAL '30 days'
        AND o.status NOT IN ('cancelado')
    )                                                             AS pedidos_30d,
    COALESCE(SUM(o.total) FILTER (
        WHERE o.created_at >= NOW() - INTERVAL '30 days'
        AND o.status NOT IN ('cancelado')
    ), 0)                                                         AS faturamento_30d,
    COUNT(DISTINCT o.id) FILTER (
        WHERE DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
        AND o.status NOT IN ('cancelado')
    )                                                             AS pedidos_hoje,
    COALESCE(SUM(o.total) FILTER (
        WHERE DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
        AND o.status NOT IN ('cancelado')
    ), 0)                                                         AS faturamento_hoje,
    COALESCE(AVG(o.total) FILTER (
        WHERE o.created_at >= NOW() - INTERVAL '30 days'
        AND o.status NOT IN ('cancelado')
    ), 0)                                                         AS ticket_medio_30d,
    COUNT(DISTINCT o.id) FILTER (
        WHERE o.status = 'novo'
    )                                                             AS pedidos_pendentes
FROM public.restaurants r
LEFT JOIN public.orders o ON o.restaurant_id = r.id
WHERE r.user_id = auth.uid()
GROUP BY r.id, r.user_id;

GRANT SELECT ON public.vw_analytics_operador TO authenticated;

-- ── Function: produtos mais vendidos ──────────────────────
CREATE OR REPLACE FUNCTION public.fn_produtos_mais_vendidos(
    p_restaurant_id UUID,
    p_dias          INTEGER DEFAULT 30,
    p_limite        INTEGER DEFAULT 10
)
RETURNS TABLE (
    produto_nome    TEXT,
    total_vendido   BIGINT,
    receita_total   DECIMAL(12, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT
        oi.nome_produto                     AS produto_nome,
        SUM(oi.quantidade)::BIGINT          AS total_vendido,
        SUM(oi.preco_total)                 AS receita_total
    FROM public.order_items oi
    INNER JOIN public.orders o ON o.id = oi.order_id
    WHERE o.restaurant_id = p_restaurant_id
      AND o.status NOT IN ('cancelado')
      AND o.created_at >= NOW() - (p_dias || ' days')::INTERVAL
    GROUP BY oi.nome_produto
    ORDER BY total_vendido DESC
    LIMIT p_limite;
END;
$$;

-- ── Function: pedidos por hora do dia ─────────────────────
CREATE OR REPLACE FUNCTION public.fn_pedidos_por_hora(
    p_restaurant_id UUID,
    p_dias          INTEGER DEFAULT 7
)
RETURNS TABLE (
    hora        INTEGER,
    total       BIGINT,
    faturamento DECIMAL(12, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'America/Sao_Paulo')::INTEGER AS hora,
        COUNT(*)::BIGINT                                                            AS total,
        SUM(o.total)                                                                AS faturamento
    FROM public.orders o
    WHERE o.restaurant_id = p_restaurant_id
      AND o.status NOT IN ('cancelado')
      AND o.created_at >= NOW() - (p_dias || ' days')::INTERVAL
    GROUP BY EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'America/Sao_Paulo')
    ORDER BY hora;
END;
$$;

COMMENT ON VIEW public.vw_analytics_operador IS 'Resumo operacional por restaurante para o painel do operador';
COMMENT ON FUNCTION public.fn_produtos_mais_vendidos IS 'Retorna os produtos mais vendidos de um restaurante num período';
COMMENT ON FUNCTION public.fn_pedidos_por_hora IS 'Retorna distribuição de pedidos por hora do dia';
