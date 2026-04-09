-- =====================================================================
-- 062 — REBALANCEAMENTO DO PLANO DE ENTRADA
-- =====================================================================
-- Objetivo: reduzir canibalização do self-service simples, manter a
-- entrada simbólica e preservar a diferenciação do canal profissional.
--
-- Ajustes:
--   • Nome comercial: Plano Começo
--   • Mensalidade simbólica: R$ 14,90
--   • Plano anual: R$ 149,90
--   • Taxa de ativação via PIX: R$ 19,90
--   • Taxa de ativação no cartão: R$ 24,90
--   • Limite de 15 produtos
--   • Limite de 60 pedidos/mês como guardrail de upgrade
--
-- Data: 2026-04-09
-- Autor: Tiago (Owner) + GitHub Copilot
-- =====================================================================
UPDATE plans
SET nome = 'Plano Começo',
    descricao = 'Plano de entrada enxuto para validar o canal digital sem canibalizar a operação principal.',
    preco_mensal = 14.90::DECIMAL(10, 2),
    preco_anual = 149.90::DECIMAL(10, 2),
    limites = jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    COALESCE(limites, '{}'::jsonb),
                    '{maxProducts}',
                    to_jsonb(15)
                ),
                '{maxOrdersPerMonth}',
                to_jsonb(60)
            ),
            '{activationFeePix}',
            to_jsonb(19.90)
        ),
        '{activationFeeCard}',
        to_jsonb(24.90)
    )
WHERE slug = 'semente';