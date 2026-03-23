-- =============================================
-- 035: Tornar increment_template_sales idempotente
-- Usa contagem real de user_purchases ativas
-- em vez de incrementar cegamente (+1)
-- =============================================
CREATE OR REPLACE FUNCTION increment_template_sales(template_id UUID) RETURNS VOID AS $$ BEGIN
UPDATE templates
SET sales_count = (
        SELECT COUNT(*)
        FROM user_purchases
        WHERE user_purchases.template_id = increment_template_sales.template_id
            AND status = 'active'
    )
WHERE id = increment_template_sales.template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;