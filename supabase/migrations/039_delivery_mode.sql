-- =============================================
-- MIGRATION 039: delivery_mode por restaurant
-- =============================================
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'whatsapp_only' CHECK (
        delivery_mode IN ('whatsapp_only', 'terminal_only', 'hybrid')
    );
COMMENT ON COLUMN restaurants.delivery_mode IS 'Modo de atendimento: whatsapp_only | terminal_only | hybrid';