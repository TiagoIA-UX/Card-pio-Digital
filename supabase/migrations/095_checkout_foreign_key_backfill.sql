-- =====================================================
-- 095: Backfill das foreign keys de checkout
--
-- Objetivo:
-- - recompor constraints que ficaram condicionais cedo demais na migration 003
-- - sem editar migrations históricas já aplicadas
-- - manter execução idempotente e auditável
-- =====================================================
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'template_orders_coupon_id_fkey'
) THEN
ALTER TABLE public.template_orders
ADD CONSTRAINT template_orders_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE
SET NULL;
END IF;
END;
$$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'template_order_items_template_id_fkey'
) THEN
ALTER TABLE public.template_order_items
ADD CONSTRAINT template_order_items_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE
SET NULL;
END IF;
END;
$$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_purchases_template_id_fkey'
) THEN
ALTER TABLE public.user_purchases
ADD CONSTRAINT user_purchases_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE
SET NULL;
END IF;
END;
$$;