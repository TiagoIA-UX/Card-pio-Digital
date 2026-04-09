-- =====================================================================
-- 060 — PLANO SEMENTE (Free Tier para negócios iniciantes)
-- =====================================================================
-- Objetivo: Dar oportunidade real a micro-deliverys de validar o canal
-- digital, crescer, e migrar para um plano pago quando o volume justificar.
--
-- Limites:
--   • 25 produtos no cardápio
--   • 120 pedidos por mês
--   • WhatsApp automático INCLUÍDO (é o core do produto)
--   • Watermark "Feito com Zairyx" no rodapé público
--   • Sem suporte humano (apenas FAQ)
--   • Sem analytics
--   • Sem domínio próprio (slug.zairyx.com.br apenas)
--
-- Cálculo de viabilidade (avg R$ 40/pedido):
--   120 pedidos × R$ 40 = R$ 4.800 receita
--   - Ingredientes 35% = R$ 1.680
--   - Embalagem 5% = R$ 240
--   - Entregador ~R$ 7 = R$ 840
--   = R$ 2.040 líquido → mais compatível com fase inicial real
--   Upgrade p/ Básico (R$ 147) = 3% da receita → decisão fácil
--
-- Data: 2025-04-09
-- Autor: Tiago (Owner) + ForgeOps AI
-- =====================================================================
INSERT INTO plans (
        nome,
        slug,
        descricao,
        preco_mensal,
        preco_anual,
        ativo,
        destaque,
        ordem,
        features,
        limites
    )
SELECT 'Plano Semente',
    'semente',
    'Plano gratuito para negócios iniciantes — cresça sem risco e faça upgrade quando estiver pronto.',
    0::DECIMAL(10, 2),
    0::DECIMAL(10, 2),
    TRUE,
    FALSE,
    0,
    -- ordem 0 = aparece antes do Básico
    '["whatsapp_auto_order", "cardapio_digital", "link_compartilhavel"]'::jsonb,
    jsonb_build_object(
        'maxProducts',
        25,
        'maxOrdersPerMonth',
        120,
        'hasAnalytics',
        false,
        'hasCustomDomain',
        false,
        'hasSupport',
        false,
        'hasWatermark',
        true,
        'supportLevel',
        'faq_only'
    )
WHERE NOT EXISTS (
        SELECT 1
        FROM plans
        WHERE slug = 'semente'
    );
-- =====================================================================
-- RPC: Verificar se o delivery atingiu o limite de pedidos do mês
-- Usado pelo middleware/API para bloquear pedidos excedentes no Semente
-- =====================================================================
CREATE OR REPLACE FUNCTION check_monthly_order_limit(p_restaurant_id UUID) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_plan_slug TEXT;
v_max_orders INT;
v_current_count INT;
v_month_start TIMESTAMPTZ;
BEGIN -- Busca o plano do restaurante
SELECT plan_slug INTO v_plan_slug
FROM restaurants
WHERE id = p_restaurant_id;
-- Se não é semente, sem limite
IF v_plan_slug IS NULL
OR v_plan_slug != 'semente' THEN RETURN jsonb_build_object(
    'allowed',
    true,
    'plan',
    COALESCE(v_plan_slug, 'basico'),
    'limit',
    null,
    'current',
    null
);
END IF;
-- Limite do plano semente
SELECT (limites->>'maxOrdersPerMonth')::INT INTO v_max_orders
FROM plans
WHERE slug = 'semente';
IF v_max_orders IS NULL THEN v_max_orders := 120;
-- fallback
END IF;
-- Conta pedidos do mês atual
v_month_start := date_trunc('month', NOW());
SELECT COUNT(*) INTO v_current_count
FROM orders
WHERE restaurant_id = p_restaurant_id
    AND created_at >= v_month_start
    AND status NOT IN ('cancelled', 'rejected');
RETURN jsonb_build_object(
    'allowed',
    v_current_count < v_max_orders,
    'plan',
    'semente',
    'limit',
    v_max_orders,
    'current',
    v_current_count,
    'remaining',
    GREATEST(v_max_orders - v_current_count, 0),
    'upgrade_needed',
    v_current_count >= v_max_orders
);
END;
$$;
-- =====================================================================
-- RPC: Verificar se o delivery atingiu o limite de produtos
-- =====================================================================
CREATE OR REPLACE FUNCTION check_product_limit(p_restaurant_id UUID) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_plan_slug TEXT;
v_max_products INT;
v_current_count INT;
BEGIN
SELECT plan_slug INTO v_plan_slug
FROM restaurants
WHERE id = p_restaurant_id;
-- Busca limite do plano
IF v_plan_slug = 'semente' THEN
SELECT (limites->>'maxProducts')::INT INTO v_max_products
FROM plans
WHERE slug = 'semente';
IF v_max_products IS NULL THEN v_max_products := 25;
END IF;
ELSIF v_plan_slug = 'pro' THEN v_max_products := 200;
ELSIF v_plan_slug = 'premium' THEN v_max_products := 1200;
ELSE v_max_products := 60;
-- basico ou fallback
END IF;
SELECT COUNT(*) INTO v_current_count
FROM products
WHERE restaurant_id = p_restaurant_id
    AND ativo = true;
RETURN jsonb_build_object(
    'allowed',
    v_current_count < v_max_products,
    'plan',
    COALESCE(v_plan_slug, 'basico'),
    'limit',
    v_max_products,
    'current',
    v_current_count,
    'remaining',
    GREATEST(v_max_products - v_current_count, 0),
    'upgrade_needed',
    v_current_count >= v_max_products
);
END;
$$;