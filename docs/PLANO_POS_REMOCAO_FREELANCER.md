# Plano Pós-Remoção do Módulo Freelancer

## Objetivo

Fechar a remoção do módulo freelancer com segurança operacional e preparar a fase 2 de banco sem editar histórico de migration nem criar risco desnecessário em produção.

## Estado Atual

- Código ativo removido: páginas, APIs, serviço, cron e testes.
- Build de produção validada com sucesso.
- Referências residuais relevantes no repositório: somente histórico de schema em [supabase/migrations/027_support_freelancers_penalties.sql](supabase/migrations/027_support_freelancers_penalties.sql).
- Decisão atual: não alterar a migration histórica. Toda limpeza de banco deve ser feita por novas migrations forward-only.

## Checklist Enxuto de Pós-Remoção para Produção

Use este checklist imediatamente antes e logo depois do deploy.

### Gate técnico

- [ ] Confirmar que o deploy publicado veio da build validada.
- [ ] Confirmar que [vercel.json](vercel.json) não contém mais o cron de expire-access.
- [ ] Confirmar que o menu admin não exibe mais acesso para freelancers.
- [ ] Confirmar que [app/admin/logs/page.tsx](app/admin/logs/page.tsx) não expõe mais filtros freelancer e freelancer_job.
- [ ] Confirmar que as rotas removidas retornam 404 ou não existem mais:
  - [ ] /admin/freelancers
  - [ ] /api/admin/freelancers
  - [ ] /api/freelancer/job
  - [ ] /api/cron/expire-access

### Gate operacional

- [ ] Monitorar logs por 24h para 404/500 relacionados a freelancer, freelancer_job e expire-access.
- [ ] Verificar se nenhum job externo, webhook interno ou automação ainda chama endpoints antigos.
- [ ] Comunicar a remoção para quem opera admin, suporte e vendas.

### Gate de validação do produto

- [ ] criação: usuário consegue criar conta e entrar.
- [ ] cardápio: delivery consegue cadastrar ou editar itens sem ajuda.
- [ ] link: cardápio público abre pelo link certo.
- [ ] pedido: pedido real percorre catálogo, carrinho e status.
- [ ] painel: dono do delivery consegue operar painel sem depender de você.

### Critério de saída

Se os 5 itens acima estiverem verdes, a remoção está encerrada do ponto de vista de produto. Se não estiverem, não voltar para engenharia por reflexo: corrigir só o que quebra venda, ativação ou operação.

## Resíduos Relevantes Restantes

Hoje, os únicos resíduos estruturais relevantes são históricos de banco em [supabase/migrations/027_support_freelancers_penalties.sql](supabase/migrations/027_support_freelancers_penalties.sql).

Eles existem em três grupos:

1. Tabelas legadas
   - freelancers
   - freelancer_jobs
   - freelancer_access

2. Função legada
   - expire_freelancer_access()

3. Checks e trilha histórica
   - checks que ainda aceitam o valor freelancer em colunas antigas
   - logs históricos em system_logs

Conclusão: o app está limpo. O que resta é cleanup de banco, não cleanup de produto.

## Fase 2 de Banco

## Princípios

- Não reescrever a migration 027.
- Fazer tudo com novas migrations.
- Separar desativação de drop definitivo.
- Ter backup lógico e rollback antes de qualquer DROP.
- Preservar trilha histórica de auditoria.

## Estratégia Recomendada

Executar em duas etapas:

1. Fase 2A: arquivar e desativar
2. Fase 2B: dropar definitivamente após janela de observação

## Fase 2A - Arquivar e Desativar

### Objetivo

Remover risco operacional sem apagar dados imediatamente.

### Janela recomendada

- staging primeiro
- produção depois
- observar entre 7 e 14 dias antes do drop definitivo

### Backup mínimo obrigatório

Antes de qualquer migration destrutiva:

1. Fazer backup gerenciado do banco
   - usar PITR ou backup administrado do provedor, se disponível
   - registrar timestamp exato do ponto de restauração

2. Fazer backup lógico em schema de arquivo

SQL sugerido:

```sql
create schema if not exists archive_freelancer_20260324;

create table if not exists archive_freelancer_20260324.freelancers
as table public.freelancers;

create table if not exists archive_freelancer_20260324.freelancer_jobs
as table public.freelancer_jobs;

create table if not exists archive_freelancer_20260324.freelancer_access
as table public.freelancer_access;

create table if not exists archive_freelancer_20260324.system_logs_freelancer
as
select *
from public.system_logs
where actor_type = 'freelancer'
   or entity in ('freelancer', 'freelancer_job', 'freelancer_access');
```

3. Tirar inventário de linhas antes do corte

```sql
select 'freelancers' as table_name, count(*) as total from public.freelancers
union all
select 'freelancer_jobs', count(*) from public.freelancer_jobs
union all
select 'freelancer_access', count(*) from public.freelancer_access;
```

### Auditorias antes de desativar

Executar e salvar o resultado destas consultas:

```sql
select count(*) as restaurants_with_freelancer_owner
from public.restaurants
where support_owner = 'freelancer';

select count(*) as tickets_assigned_to_freelancer
from public.support_tickets
where assigned_type = 'freelancer';

select count(*) as active_freelancer_access
from public.freelancer_access
where revoked_at is null and expires_at > now();
```

Se qualquer uma retornar valor maior que zero, não dropar ainda.

### O que desativar na Fase 2A

1. Remover a função legada de expiração

```sql
drop function if exists public.expire_freelancer_access();
```

2. Congelar as tabelas legadas em modo arquivo
   - sem rotas no app
   - sem cron
   - sem writes esperados

3. Opcional: adicionar comentários explícitos de depreciação

```sql
comment on table public.freelancers is 'DEPRECATED: tabela legada arquivada para rollback e auditoria';
comment on table public.freelancer_jobs is 'DEPRECATED: tabela legada arquivada para rollback e auditoria';
comment on table public.freelancer_access is 'DEPRECATED: tabela legada arquivada para rollback e auditoria';
```

### Migration sugerida para a Fase 2A

Nome sugerido:

- 036_archive_and_deactivate_freelancer_module.sql

Escopo esperado:

- criar schema de archive
- copiar dados
- registrar comentários de depreciação
- dropar função expire_freelancer_access()

## Fase 2B - Drop Definitivo

### Pré-condições

Só executar se todas as condições abaixo forem verdadeiras:

- [ ] janela de observação concluída
- [ ] nenhuma chamada nova aos endpoints antigos
- [ ] nenhum acesso ativo legado
- [ ] nenhum ticket com assigned_type = freelancer
- [ ] nenhum restaurant com support_owner = freelancer
- [ ] backup lógico e backup gerenciado confirmados

### Drop recomendado

SQL base:

```sql
drop table if exists public.freelancer_access;
drop table if exists public.freelancer_jobs;
drop table if exists public.freelancers;
```

Observação:

- índices, triggers e policies dessas tabelas caem junto com o DROP TABLE
- não usar cascade sem necessidade

### Tightening opcional de schema

Depois do drop, avaliar se vale restringir checks antigos.

Aplicar só se não houver dado histórico que dependa desses valores:

1. support_tickets.assigned_type
   - remover freelancer do check

2. restaurants.support_owner
   - remover freelancer do check

3. system_logs.actor_type
   - normalmente manter freelancer por histórico
   - só remover se os logs históricos forem arquivados antes

Recomendação prática:

- apertar support_tickets e restaurants
- manter system_logs mais permissivo para não destruir histórico

### Migration sugerida para a Fase 2B

Nome sugerido:

- 037_drop_freelancer_tables.sql

Opcional depois:

- 038_remove_freelancer_checks.sql

## Rollback

## Opção preferida

Restaurar pelo backup gerenciado ou PITR até o timestamp salvo antes da migration destrutiva.

## Opção rápida com archive schema

Se o problema ocorrer depois da Fase 2A e antes do drop definitivo, basta manter as tabelas como estão e restaurar apenas a função:

```sql
-- recriar expire_freelancer_access() a partir da definição histórica da migration 027
```

## Opção completa após DROP

Se o problema ocorrer após a Fase 2B:

1. recriar as tabelas com nova migration de rollback baseada na DDL original da 027
2. restaurar os dados do schema archive
3. recriar função, índices, triggers e policies

Fluxo resumido:

```sql
insert into public.freelancers
select * from archive_freelancer_20260324.freelancers;

insert into public.freelancer_jobs
select * from archive_freelancer_20260324.freelancer_jobs;

insert into public.freelancer_access
select * from archive_freelancer_20260324.freelancer_access;
```

Importante:

- esse restore de dados só funciona depois de recriar a estrutura
- por isso PITR continua sendo o rollback principal

## Sequência Recomendada de Execução

1. Deploy já limpo do app
2. Validar os 5 gates de produto
3. Executar Fase 2A em staging
4. Revalidar smoke e operação
5. Executar Fase 2A em produção
6. Observar por 7 a 14 dias
7. Executar Fase 2B em staging
8. Revalidar
9. Executar Fase 2B em produção

## Decisão Executiva

Hoje, a recomendação correta é:

- remover do produto: concluído
- mexer no banco: sim, mas em duas etapas
- dropar imediatamente: não
- arquivar e observar antes: sim

Isso mantém foco no core do produto sem criar risco desnecessário no banco.