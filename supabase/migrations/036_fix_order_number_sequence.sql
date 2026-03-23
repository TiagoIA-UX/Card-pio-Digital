-- =====================================================
-- Migration 036 — Corrige geração atômica de número do pedido
--
-- A implementação anterior usava MAX(numero_pedido) + 1 com FOR UPDATE,
-- o que é inválido com aggregate no PostgreSQL e quebrava o fluxo de pedido.
-- Esta versão usa uma tabela de sequência por restaurante com upsert atômico.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_number_sequences (
    restaurant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
    last_value INTEGER NOT NULL DEFAULT 0 CHECK (last_value >= 0),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION public.get_next_order_number(p_restaurant_id UUID) RETURNS INTEGER LANGUAGE plpgsql
SET search_path = '' AS $$
DECLARE next_num INTEGER;
BEGIN
INSERT INTO public.order_number_sequences AS seq (restaurant_id, last_value, updated_at)
VALUES (p_restaurant_id, 1, NOW()) ON CONFLICT (restaurant_id) DO
UPDATE
SET last_value = seq.last_value + 1,
    updated_at = NOW()
RETURNING seq.last_value INTO next_num;
RETURN next_num;
END;
$$;
INSERT INTO public.order_number_sequences (restaurant_id, last_value, updated_at)
SELECT restaurant_id,
    MAX(numero_pedido),
    NOW()
FROM public.orders
GROUP BY restaurant_id ON CONFLICT (restaurant_id) DO
UPDATE
SET last_value = GREATEST(
        public.order_number_sequences.last_value,
        EXCLUDED.last_value
    ),
    updated_at = NOW();