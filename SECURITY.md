# Política de Segurança

## Versões Suportadas

| Versão     | Suporte        |
| ---------- | -------------- |
| 2.x (main) | ✅ Ativo       |
| < 2.0      | ❌ Sem suporte |

## Reportar uma Vulnerabilidade

Se você descobriu uma vulnerabilidade de segurança, **não abra uma issue pública**.

Envie um email para **tiago@tiagoia.dev** com:

1. Descrição da vulnerabilidade
2. Passos para reproduzir
3. Impacto potencial
4. Sugestão de correção (se tiver)

**Tempo de resposta esperado:** 48 horas para confirmação, 7 dias para correção de vulnerabilidades críticas.

## Práticas de Segurança Implementadas

### Banco de Dados (Supabase/PostgreSQL)

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **SECURITY DEFINER** views para consultas sensíveis com `search_path` hardened
- Migrations incrementais versionadas (27+)
- Separação clara de roles (anon, authenticated, service_role)

### Autenticação

- Supabase Auth com verificação de email obrigatória
- Hierarquia de admin: owner → admin → viewer
- Middleware de proteção em rotas administrativas
- Sessões gerenciadas via cookies HttpOnly

### APIs

- Rate limiting via Upstash Redis em endpoints públicos
- Validação de input com Zod em todas as rotas
- Proteção CSRF via headers de origem
- Webhooks validados com assinaturas (Mercado Pago)

### Infraestrutura

- Deploy via Vercel com HTTPS obrigatório
- Variáveis de ambiente nunca expostas ao client-side (prefixo `NEXT_PUBLIC_` controlado)
- CDN Cloudflare R2 para assets estáticos
- CI/CD com lint e build obrigatórios antes do merge

## Escopo

Esta política cobre o código-fonte do repositório e a instância de produção em https://zairyx.com. Não cobre serviços de terceiros (Supabase, Vercel, Mercado Pago, Cloudflare).
