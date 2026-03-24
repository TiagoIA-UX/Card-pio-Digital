-- ============================================================
-- 040: Sistema de Fidelidade por Restaurante
-- Pontuação, saldo e histórico de resgates por cliente
-- ============================================================

-- ── Configuração do programa de fidelidade ────────────────
CREATE TABLE IF NOT EXISTS public.fidelidade_config (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL UNIQUE REFERENCES public.restaurants(id) ON DELETE CASCADE,
    ativo               BOOLEAN NOT NULL DEFAULT TRUE,
    pontos_por_real     DECIMAL(10, 2) NOT NULL DEFAULT 1.00 CHECK (pontos_por_real > 0),
    valor_por_ponto     DECIMAL(10, 4) NOT NULL DEFAULT 0.01 CHECK (valor_por_ponto > 0),
    resgate_minimo      INTEGER NOT NULL DEFAULT 100 CHECK (resgate_minimo > 0),
    validade_dias       INTEGER CHECK (validade_dias IS NULL OR validade_dias > 0),
    nome_programa       TEXT NOT NULL DEFAULT 'Programa de Fidelidade',
    descricao           TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fidelidade_config_restaurant ON public.fidelidade_config(restaurant_id);

CREATE TRIGGER trg_fidelidade_config_updated_at
    BEFORE UPDATE ON public.fidelidade_config
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.fidelidade_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fidelidade_config_owner_all ON public.fidelidade_config;
CREATE POLICY fidelidade_config_owner_all ON public.fidelidade_config
    FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS fidelidade_config_public_select ON public.fidelidade_config;
CREATE POLICY fidelidade_config_public_select ON public.fidelidade_config
    FOR SELECT TO anon, authenticated
    USING (ativo = TRUE);

DROP POLICY IF EXISTS fidelidade_config_service_all ON public.fidelidade_config;
CREATE POLICY fidelidade_config_service_all ON public.fidelidade_config
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ── Saldo de pontos por cliente por restaurante ───────────
CREATE TABLE IF NOT EXISTS public.fidelidade_clientes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    cliente_telefone    TEXT NOT NULL,
    cliente_nome        TEXT,
    pontos_acumulados   INTEGER NOT NULL DEFAULT 0 CHECK (pontos_acumulados >= 0),
    pontos_resgatados   INTEGER NOT NULL DEFAULT 0 CHECK (pontos_resgatados >= 0),
    pontos_expirados    INTEGER NOT NULL DEFAULT 0 CHECK (pontos_expirados >= 0),
    ultima_compra_at    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fidelidade_cliente UNIQUE (restaurant_id, cliente_telefone)
);

CREATE INDEX IF NOT EXISTS idx_fidelidade_clientes_restaurant ON public.fidelidade_clientes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fidelidade_clientes_telefone ON public.fidelidade_clientes(restaurant_id, cliente_telefone);

CREATE TRIGGER trg_fidelidade_clientes_updated_at
    BEFORE UPDATE ON public.fidelidade_clientes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.fidelidade_clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fidelidade_clientes_owner_all ON public.fidelidade_clientes;
CREATE POLICY fidelidade_clientes_owner_all ON public.fidelidade_clientes
    FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS fidelidade_clientes_service_all ON public.fidelidade_clientes;
CREATE POLICY fidelidade_clientes_service_all ON public.fidelidade_clientes
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ── Histórico de transações de pontos ─────────────────────
CREATE TABLE IF NOT EXISTS public.fidelidade_transacoes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    cliente_id          UUID NOT NULL REFERENCES public.fidelidade_clientes(id) ON DELETE CASCADE,
    order_id            UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    tipo                TEXT NOT NULL CHECK (tipo IN ('credito', 'debito', 'expiracao')),
    pontos              INTEGER NOT NULL CHECK (pontos > 0),
    descricao           TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fidelidade_transacoes_restaurant ON public.fidelidade_transacoes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fidelidade_transacoes_cliente ON public.fidelidade_transacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_fidelidade_transacoes_order ON public.fidelidade_transacoes(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fidelidade_transacoes_created ON public.fidelidade_transacoes(created_at DESC);

ALTER TABLE public.fidelidade_transacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fidelidade_transacoes_owner_all ON public.fidelidade_transacoes;
CREATE POLICY fidelidade_transacoes_owner_all ON public.fidelidade_transacoes
    FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS fidelidade_transacoes_service_all ON public.fidelidade_transacoes;
CREATE POLICY fidelidade_transacoes_service_all ON public.fidelidade_transacoes
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

COMMENT ON TABLE public.fidelidade_config IS 'Configuração do programa de fidelidade por restaurante';
COMMENT ON TABLE public.fidelidade_clientes IS 'Saldo de pontos de fidelidade por cliente por restaurante';
COMMENT ON TABLE public.fidelidade_transacoes IS 'Histórico de crédito, débito e expiração de pontos';
