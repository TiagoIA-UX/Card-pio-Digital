-- ============================================================
-- 038: Cupons por Restaurante (painel do operador)
-- Permite que cada restaurante crie e gerencie seus próprios cupons
-- ============================================================

CREATE TABLE IF NOT EXISTS public.restaurant_coupons (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    code          TEXT NOT NULL,
    description   TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    min_purchase  DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (min_purchase >= 0),
    max_uses      INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
    current_uses  INTEGER NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
    expires_at    TIMESTAMPTZ,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_restaurant_coupon_code UNIQUE (restaurant_id, code)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_restaurant_coupons_restaurant ON public.restaurant_coupons(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_coupons_code ON public.restaurant_coupons(restaurant_id, code);
CREATE INDEX IF NOT EXISTS idx_restaurant_coupons_active ON public.restaurant_coupons(restaurant_id, is_active);

-- Trigger updated_at
CREATE TRIGGER trg_restaurant_coupons_updated_at
    BEFORE UPDATE ON public.restaurant_coupons
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.restaurant_coupons ENABLE ROW LEVEL SECURITY;

-- Dono do restaurante pode gerenciar seus cupons
DROP POLICY IF EXISTS restaurant_coupons_owner_all ON public.restaurant_coupons;
CREATE POLICY restaurant_coupons_owner_all ON public.restaurant_coupons
    FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE user_id = auth.uid()
        )
    );

-- Leitura pública para validação no checkout (cupons ativos)
DROP POLICY IF EXISTS restaurant_coupons_public_select ON public.restaurant_coupons;
CREATE POLICY restaurant_coupons_public_select ON public.restaurant_coupons
    FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE);

-- Service role pode tudo
DROP POLICY IF EXISTS restaurant_coupons_service_all ON public.restaurant_coupons;
CREATE POLICY restaurant_coupons_service_all ON public.restaurant_coupons
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE public.restaurant_coupons IS 'Cupons de desconto criados por cada restaurante para seus clientes';
COMMENT ON COLUMN public.restaurant_coupons.discount_type IS 'percentage = % de desconto, fixed = valor fixo em R$';
COMMENT ON COLUMN public.restaurant_coupons.max_uses IS 'NULL = uso ilimitado';
