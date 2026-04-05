-- ============================================================
-- 049 — Fix: remover SECURITY DEFINER de 4 views
-- Resolve lint 0010_security_definer_view do Supabase
-- As views passam a respeitar RLS do usuário consultante.
-- ============================================================

ALTER VIEW public.alerts_summary SET (security_invoker = true);
ALTER VIEW public.financial_summary SET (security_invoker = true);
ALTER VIEW public.agent_tasks_summary SET (security_invoker = true);
ALTER VIEW public.agent_knowledge_top SET (security_invoker = true);
