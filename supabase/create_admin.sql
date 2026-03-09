-- =============================================
-- CRIAR PRIMEIRO ADMIN
-- Execute este SQL no Supabase SQL Editor
-- Substitua 'SEU_USER_ID' pelo UUID do seu usuário
-- =============================================

-- Para encontrar seu user_id, execute:
-- SELECT id, email FROM auth.users WHERE email = 'seu@email.com';

-- Depois insira na tabela de admins:
INSERT INTO admin_users (user_id, role)
VALUES ('SEU_USER_ID_AQUI', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Exemplo com email específico (se souber):
-- INSERT INTO admin_users (user_id, role)
-- SELECT id, 'super_admin' 
-- FROM auth.users 
-- WHERE email = 'seu@email.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- VERIFICAR ADMINS
-- =============================================
-- SELECT au.*, u.email 
-- FROM admin_users au
-- JOIN auth.users u ON u.id = au.user_id;
