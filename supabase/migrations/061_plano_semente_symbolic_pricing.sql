-- =====================================================================
-- 061 — AJUSTE COMERCIAL DO PLANO SEMENTE (ENTRADA SIMBOLICA)
-- =====================================================================
-- Objetivo: manter o Plano Semente com barreira de entrada baixa, mas
-- com valor percebido real e melhor compromisso de ativacao.
--
-- Ajustes:
--   • Mensalidade simbólica de R$ 19,90
--   • Plano anual simbólico de R$ 199,90
--   • Taxa de ativação via PIX de R$ 29,90
--   • Taxa de ativação no cartão de R$ 34,90
--
-- Data: 2026-04-09
-- Autor: Tiago (Owner) + GitHub Copilot
-- =====================================================================
UPDATE plans
SET nome = 'Plano Semente',
    descricao = 'Plano de entrada com ativação e mensalidade simbólicas para negócios iniciantes.',
    preco_mensal = 19.90::DECIMAL(10, 2),
    preco_anual = 199.90::DECIMAL(10, 2),
    limites = jsonb_set(
        jsonb_set(
            COALESCE(limites, '{}'::jsonb),
            '{activationFeePix}',
            to_jsonb(29.90)
        ),
        '{activationFeeCard}',
        to_jsonb(34.90)
    )
WHERE slug = 'semente';