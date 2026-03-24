-- ============================================================
-- 041: Avaliações de Restaurantes
-- Sistema de avaliações públicas com resposta do operador
-- ============================================================

CREATE TABLE IF NOT EXISTS public.avaliacoes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    cliente_nome    TEXT NOT NULL,
    cliente_telefone TEXT,
    nota            SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario      TEXT,
    resposta        TEXT,
    respondido_at   TIMESTAMPTZ,
    publicada       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_avaliacoes_restaurant ON public.avaliacoes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_nota ON public.avaliacoes(restaurant_id, nota);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_publicada ON public.avaliacoes(restaurant_id, publicada);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_created ON public.avaliacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_order ON public.avaliacoes(order_id) WHERE order_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER trg_avaliacoes_updated_at
    BEFORE UPDATE ON public.avaliacoes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode inserir avaliação (cliente sem conta)
DROP POLICY IF EXISTS avaliacoes_insert_public ON public.avaliacoes;
CREATE POLICY avaliacoes_insert_public ON public.avaliacoes
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Leitura pública para avaliações publicadas
DROP POLICY IF EXISTS avaliacoes_select_public ON public.avaliacoes;
CREATE POLICY avaliacoes_select_public ON public.avaliacoes
    FOR SELECT TO anon, authenticated
    USING (publicada = TRUE);

-- Dono do restaurante pode ver e moderar todas as suas avaliações
DROP POLICY IF EXISTS avaliacoes_owner_all ON public.avaliacoes;
CREATE POLICY avaliacoes_owner_all ON public.avaliacoes
    FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE user_id = auth.uid()
        )
    );

-- Service role pode tudo
DROP POLICY IF EXISTS avaliacoes_service_all ON public.avaliacoes;
CREATE POLICY avaliacoes_service_all ON public.avaliacoes
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

COMMENT ON TABLE public.avaliacoes IS 'Avaliações (1-5 estrelas) de restaurantes feitas pelos clientes';
COMMENT ON COLUMN public.avaliacoes.nota IS 'Nota de 1 a 5 estrelas';
COMMENT ON COLUMN public.avaliacoes.resposta IS 'Resposta pública do operador à avaliação';
COMMENT ON COLUMN public.avaliacoes.publicada IS 'Se falso, avaliação não é exibida publicamente';
