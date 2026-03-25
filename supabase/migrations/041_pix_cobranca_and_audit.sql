-- ========================================
-- PIX Cobrança e Sistema de Auditoria
-- Migração 041
-- ========================================
-- Criar extensão para geração de UUIDs (se não existir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Tabela: cobrancas_pix
-- Registro de cobranças PIX por pedido
CREATE TABLE IF NOT EXISTS public.cobrancas_pix (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    pedido_id UUID NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    qr_code TEXT NOT NULL,
    pix_key TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (
        status IN ('pendente', 'paga', 'cancelada', 'expirada')
    ),
    confirmada_em TIMESTAMPTZ,
    pagador_identificador TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES public.orders(id) ON DELETE CASCADE
);
-- Índices para cobrancas_pix
CREATE INDEX IF NOT EXISTS idx_cobrancas_pix_restaurant_id ON public.cobrancas_pix(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_pix_pedido_id ON public.cobrancas_pix(pedido_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_pix_status ON public.cobrancas_pix(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_pix_created_at ON public.cobrancas_pix(created_at DESC);
-- Trigger para updated_at em cobrancas_pix
CREATE TRIGGER set_updated_at_cobrancas_pix BEFORE
UPDATE ON public.cobrancas_pix FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
-- Tabela: audit_logs
-- Log centralizado de ações do sistema
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    actor TEXT NOT NULL,
    -- 'system', user_id, 'admin', etc
    action TEXT NOT NULL,
    -- 'cobranca_pix_criada', 'pedido_confirma', etc
    resource_type TEXT NOT NULL,
    -- 'cobranca_pix', 'pedido', 'restaurant', etc
    resource_id UUID NOT NULL,
    restaurant_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_id ON public.audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
-- RLS para cobrancas_pix
ALTER TABLE public.cobrancas_pix ENABLE ROW LEVEL SECURITY;
-- Admin pode ver tudo
CREATE POLICY "Admin cobrancas_pix select" ON public.cobrancas_pix FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = auth.uid()
                AND au.role IN ('admin', 'owner')
        )
    );
-- Restaurant owner pode ver suas cobrancas
CREATE POLICY "Owner cobrancas_pix select" ON public.cobrancas_pix FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.restaurants r
            WHERE r.id = restaurant_id
                AND r.user_id = auth.uid()
        )
    );
-- System role pode fazer tudo
CREATE POLICY "System cobrancas_pix admin" ON public.cobrancas_pix FOR ALL USING (true);
-- RLS para audit_logs (apenas admin e system veem)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin audit_logs select" ON public.audit_logs FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users au
            WHERE au.user_id = auth.uid()
                AND au.role IN ('admin', 'owner')
        )
    );
CREATE POLICY "System audit_logs admin" ON public.audit_logs FOR ALL USING (true);
-- Comment
COMMENT ON TABLE public.cobrancas_pix IS 'Registro de cobranças PIX por pedido. Criada com delivery_mode gate: hybrid/terminal_only apenas.';
COMMENT ON TABLE public.audit_logs IS 'Log centralizado de ações do sistema para segurança e compliance.';