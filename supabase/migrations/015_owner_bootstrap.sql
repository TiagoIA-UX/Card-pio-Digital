-- =====================================================
-- OWNER BOOTSTRAP — Garante privilégio de admin ao dono
--
-- Email do dono: globemarket7@gmail.com
-- Role: 'owner' (nível acima de 'admin')
--
-- Executa de forma idempotente:
--   • Se o usuário já existe em auth.users → insere/atualiza admin_users
--   • Se ainda não existe → nada é feito (execução na próxima migration)
-- =====================================================

-- 1. Adiciona coluna 'role' mais granular se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'admin_users'
      AND column_name  = 'role'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin';
  END IF;
END $$;

-- Garante o check constraint (idempotente)
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
    CHECK (role IN ('owner', 'admin', 'support'));

-- 2. Adiciona coluna 'email' para referência rápida (sem JOIN)
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Seed do dono — usa o email para localizar o UUID em auth.users
DO $$
DECLARE
  v_owner_email TEXT := 'globemarket7@gmail.com';
  v_user_id     UUID;
BEGIN
  -- Localiza o UUID pelo email (tabela interna do Supabase Auth)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_owner_email
  LIMIT 1;

  -- Só prossegue se o usuário já existe (foi cadastrado pelo Auth)
  IF v_user_id IS NOT NULL THEN
    -- Upsert: cria ou atualiza para garantir role = 'owner'
    INSERT INTO admin_users (user_id, email, role)
    VALUES (v_user_id, v_owner_email, 'owner')
    ON CONFLICT (user_id)
    DO UPDATE SET
      role  = 'owner',
      email = v_owner_email;

    -- Garante também na tabela users (painel) se existir
    UPDATE users
    SET role = 'owner'
    WHERE id = v_user_id;

    RAISE NOTICE 'Owner admin concedido ao usuário %', v_owner_email;
  ELSE
    RAISE NOTICE 'Usuário % ainda não existe em auth.users. Execute este script novamente após o primeiro login.', v_owner_email;
  END IF;
END $$;

-- 4. Cria função helper para promover qualquer email a admin no futuro
CREATE OR REPLACE FUNCTION grant_admin_by_email(
  p_email TEXT,
  p_role  TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF p_role NOT IN ('owner', 'admin', 'support') THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'Role inválido');
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'Usuário não encontrado');
  END IF;

  INSERT INTO admin_users (user_id, email, role)
  VALUES (v_user_id, p_email, p_role)
  ON CONFLICT (user_id)
  DO UPDATE SET role = p_role, email = p_email;

  RETURN jsonb_build_object('ok', TRUE, 'user_id', v_user_id, 'role', p_role);
END;
$$;

-- Política RLS: owner pode ver todos os registros de admin_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'admin_users'
      AND policyname = 'Owner can manage all admin records'
  ) THEN
    CREATE POLICY "Owner can manage all admin records" ON admin_users
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM admin_users a
          WHERE a.user_id = auth.uid()
            AND a.role = 'owner'
        )
      );
  END IF;
END $$;
