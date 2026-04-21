-- Rollout manual da trava 084 no Supabase SQL Editor.
-- Use este arquivo para aplicação operacional em produção sem alterar migrations antigas.
-- Este é o caminho compatível com o SQL Editor, que executa dentro de transaction block.
-- Para ambientes grandes e com tráfego elevado, a variante com CONCURRENTLY deve ser rodada
-- fora do SQL Editor, usando uma conexão SQL direta sem transaction block.
-- 1. Conferência final de duplicatas por tenant/mês/plano.
select tenant_id,
    coalesce(referencia_mes, to_char(created_at, 'YYYY-MM')) as referencia_mes,
    coalesce(plano, 'unknown_plan') as plano,
    count(*) as total
from public.affiliate_referrals
where tenant_id is not null
group by 1,
    2,
    3
having count(*) > 1
order by total desc,
    tenant_id;
-- 2. Backfill defensivo para linhas antigas sem referencia_mes e sem plano.
update public.affiliate_referrals
set referencia_mes = to_char(created_at, 'YYYY-MM')
where tenant_id is not null
    and referencia_mes is null;
update public.affiliate_referrals
set plano = 'unknown_plan'
where tenant_id is not null
    and (
        plano is null
        or btrim(plano) = ''
    );
-- 3. Remoção da trava antiga.
drop index if exists public.uniq_affiliate_referrals_tenant_month;
-- 4. Trava estrutural compatível com o SQL Editor.
create unique index if not exists uniq_affiliate_referrals_tenant_month_plan on public.affiliate_referrals (tenant_id, referencia_mes, plano)
where tenant_id is not null;
-- 5. Documentação do índice.
comment on index public.uniq_affiliate_referrals_tenant_month_plan is 'Guarda de idempotência para impedir duplicação de comissão por tenant/mês/plano';
-- Variante para ambientes maiores, fora do SQL Editor:
-- create unique index concurrently if not exists uniq_affiliate_referrals_tenant_month_plan
--   on public.affiliate_referrals (tenant_id, referencia_mes, plano)
--   where tenant_id is not null;