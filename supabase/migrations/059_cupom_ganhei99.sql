-- =====
-- Criação do cupom Ganhei99%
-- =====
INSERT INTO coupons (
        code,
        discount_type,
        discount_value,
        min_purchase,
        max_uses,
        expires_at,
        is_active
    )
VALUES (
        'Ganhei99%',
        'percentage',
        99.00,
        0,
        NULL,
        -- sem limite de uso
        NOW() + INTERVAL '1 year',
        -- Válido por 1 ano
        true
    ) ON CONFLICT (code) DO
UPDATE
SET discount_value = EXCLUDED.discount_value,
    max_uses = EXCLUDED.max_uses,
    expires_at = EXCLUDED.expires_at,
    is_active = EXCLUDED.is_active;