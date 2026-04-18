-- 094_auth_rls_initplan_batch1_core_tables.sql
-- Objetivo: reduzir avisos auth_rls_initplan em tabelas de maior uso,
-- substituindo chamadas diretas auth.uid() por (select auth.uid())
-- sem alterar semantica de acesso.
begin;
-- admin_users
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'admin_users'
        AND policyname = 'Users can view own admin record'
) THEN RAISE EXCEPTION 'Policy missing: public.admin_users -> Users can view own admin record';
END IF;
EXECUTE $sql$ ALTER POLICY "Users can view own admin record" ON public.admin_users USING (
    (
        select auth.uid()
    ) = user_id
) $sql$;
END $$;
-- subscriptions
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'subscriptions'
        AND policyname = 'Owners can view own subscriptions'
) THEN RAISE EXCEPTION 'Policy missing: public.subscriptions -> Owners can view own subscriptions';
END IF;
EXECUTE $sql$ ALTER POLICY "Owners can view own subscriptions" ON public.subscriptions USING (
    (
        select auth.uid()
    ) = user_id
) $sql$;
END $$;
-- template_orders
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'template_orders'
        AND policyname = 'Usuários podem ver próprios pedidos'
) THEN RAISE EXCEPTION 'Policy missing: public.template_orders -> Usuários podem ver próprios pedidos';
END IF;
EXECUTE $sql$ ALTER POLICY "Usuários podem ver próprios pedidos" ON public.template_orders USING (
    (
        select auth.uid()
    ) = user_id
) $sql$;
END $$;
-- user_purchases
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'user_purchases'
        AND policyname = 'Usuários podem ver próprias compras'
) THEN RAISE EXCEPTION 'Policy missing: public.user_purchases -> Usuários podem ver próprias compras';
END IF;
EXECUTE $sql$ ALTER POLICY "Usuários podem ver próprias compras" ON public.user_purchases USING (
    (
        select auth.uid()
    ) = user_id
) $sql$;
END $$;
-- checkout_sessions
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'checkout_sessions'
        AND policyname = 'Owners can view own checkout sessions'
) THEN RAISE EXCEPTION 'Policy missing: public.checkout_sessions -> Owners can view own checkout sessions';
END IF;
EXECUTE $sql$ ALTER POLICY "Owners can view own checkout sessions" ON public.checkout_sessions USING (
    (
        select auth.uid()
    ) = user_id
) $sql$;
END $$;
-- system_logs
-- Nenhuma policy com auth.uid() encontrada no estado atual desta base.
-- Mantido fora de ALTER POLICY por seguranca semantica.
-- audit_logs
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'audit_logs'
        AND policyname = 'Admin audit_logs select'
) THEN RAISE EXCEPTION 'Policy missing: public.audit_logs -> Admin audit_logs select';
END IF;
EXECUTE $sql$ ALTER POLICY "Admin audit_logs select" ON public.audit_logs USING (
    EXISTS (
        SELECT 1
        FROM admin_users au
        WHERE au.user_id = (
                select auth.uid()
            )
            AND au.role = ANY (ARRAY ['admin'::text, 'owner'::text])
    )
) $sql$;
END $$;
-- order_items
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'order_items'
        AND policyname = 'Dono pode ver items dos pedidos'
) THEN RAISE EXCEPTION 'Policy missing: public.order_items -> Dono pode ver items dos pedidos';
END IF;
EXECUTE $sql$ ALTER POLICY "Dono pode ver items dos pedidos" ON public.order_items USING (
    EXISTS (
        SELECT 1
        FROM orders
            JOIN restaurants ON restaurants.id = orders.restaurant_id
        WHERE orders.id = order_items.order_id
            AND restaurants.user_id = (
                select auth.uid()
            )
    )
) $sql$;
END $$;
commit;