-- ============================================================
-- 037: Tabela de Mesas por Restaurante
-- Cria gestão de mesas com whitelist, tokens de QR e status
-- ============================================================
-- Tabela de mesas
CREATE TABLE IF NOT EXISTS public.restaurant_mesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    label VARCHAR(50),
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_restaurant_mesa UNIQUE (restaurant_id, numero),
    CONSTRAINT ck_mesa_numero_positivo CHECK (
        numero > 0
        AND numero <= 999
    )
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_restaurant_mesas_restaurant ON public.restaurant_mesas(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_mesas_ativa ON public.restaurant_mesas(restaurant_id, ativa);
-- Trigger atualizar updated_at
CREATE TRIGGER trg_restaurant_mesas_updated_at BEFORE
UPDATE ON public.restaurant_mesas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- RLS
ALTER TABLE public.restaurant_mesas ENABLE ROW LEVEL SECURITY;
-- Dono do restaurante pode gerenciar suas mesas
DROP POLICY IF EXISTS restaurant_mesas_owner_all ON public.restaurant_mesas;
CREATE POLICY restaurant_mesas_owner_all ON public.restaurant_mesas FOR ALL USING (
    restaurant_id IN (
        SELECT id
        FROM public.restaurants
        WHERE user_id = auth.uid()
    )
);
-- Leitura pública para validação no cardápio (mesas ativas)
DROP POLICY IF EXISTS restaurant_mesas_public_select ON public.restaurant_mesas;
CREATE POLICY restaurant_mesas_public_select ON public.restaurant_mesas FOR
SELECT USING (ativa = TRUE);
-- Vincular mesa_numero ao pedido (garantir que o campo é preenchido)
-- O campo mesa_numero já existe na tabela orders (migration 002)
-- Apenas garantir que há índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_orders_origem_mesa ON public.orders(origem_pedido, mesa_numero)
WHERE origem_pedido = 'mesa';
COMMENT ON TABLE public.restaurant_mesas IS 'Mesas cadastradas por restaurante para pedidos via QR Code';
COMMENT ON COLUMN public.restaurant_mesas.numero IS 'Número visível da mesa (1-999)';
COMMENT ON COLUMN public.restaurant_mesas.label IS 'Nome opcional (ex: Varanda, VIP, Terraço)';
COMMENT ON COLUMN public.restaurant_mesas.ativa IS 'Se falso, mesa não aceita novos pedidos';