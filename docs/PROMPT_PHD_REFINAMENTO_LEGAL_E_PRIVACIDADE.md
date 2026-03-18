# PROMPT PhD — Refinamento Legal, Privacidade e Transparência

> **Versão:** 1.0 — 18 mar 2026
> **Uso:** Copiar integralmente e colar em um agente de IA (Claude, GPT-4, Copilot)
> para execução imediata no repositório.
> **Repositório:** `TiagoIA-UX/Cardapio-Digital` · branch `rename/cardapio-digital`

---

## CONTEXTO DO SISTEMA

| Item                 | Valor                                                  |
| -------------------- | ------------------------------------------------------ |
| **Domínio**          | zairyx.com                                             |
| **Stack**            | Next.js App Router · React · TypeScript · Tailwind CSS |
| **Backend**          | Supabase (Auth SSR + Postgres + RLS)                   |
| **Pagamentos**       | Mercado Pago (preferências + webhooks)                 |
| **Storage**          | Cloudflare R2 (imagens de cardápio)                    |
| **IA**               | Groq (chat de vendas Cadu + mentor Prof. Nilo)         |
| **Analytics**        | Vercel Analytics (se ativado)                          |
| **Deploy**           | Vercel                                                 |
| **Empresa**          | Zairyx Soluções Tecnológicas (pessoa física, CPF)      |
| **Email de contato** | zairyx.ai@gmail.com                                    |
| **WhatsApp**         | (12) 99688-7993                                        |

---

## O QUE JÁ FOI FEITO (sessões 17-18/03/2026)

### Auditoria Jurídica (17/03)

- 24 achados (3 críticos, 8 altos, 9 médios, 4 baixos)
- 11 correções aplicadas: data fixa, foro CDC, arrependimento 7 dias, LGPD Art. 18/33/7º/8º§5, tabela de cookies, terceiros nomeados

### Segurança e Infra (18/03)

- WhatsApp Business: 13 links migrados de `wa.me` para `api.whatsapp.com/send`
- Service role key: fallback inseguro removido de `indicacao` + `webhook/mercadopago`
- Zod validation: adicionado em `admin/clientes`, `admin/team`, `admin/bonus-fund`
- Emails atualizados: `contato@cardapio.digital` → `zairyx.ai@gmail.com` em todas as páginas legais
- Testes: 3 assertions desatualizadas corrigidas → 11/11 passando

### Decisões do Tiago (18/03)

- **Não tem CNPJ** — opera como pessoa física (CPF)
- **Dados pessoais NÃO ficam expostos** — CPF, endereço e nome completo removidos das páginas públicas
- **Email real:** zairyx.ai@gmail.com (os emails @cardapio.digital não existem)
- **DPO:** o próprio Tiago (informado internamente, não publicado)

---

## TAREFAS PARA EXECUTAR AGORA

### TAREFA 1 — Dados coletados automaticamente na Política de Privacidade

**Arquivo:** `app/privacidade/page.tsx`

**O que fazer:**
Na seção "1. Informações que Coletamos", adicionar um novo bloco APÓS a lista atual de dados fornecidos diretamente:

```
Também coletamos automaticamente:
- Endereço IP e dados de conexão (registros de acesso — Marco Civil Art. 15)
- Tipo de navegador e sistema operacional (user-agent)
- Dados do perfil Google (nome e email) quando você faz login via Google OAuth
- Páginas acessadas e tempo de permanência (via Vercel Analytics, quando ativo — dados agregados)
```

**Justificativa:** LGPD Art. 9º exige transparência sobre todos os dados tratados. IP e user-agent são coletados pelo servidor (Vercel/Supabase logs). Google OAuth fornece nome e email automaticamente.

---

### TAREFA 2 — Clarificar cookies e Vercel Analytics

**Arquivo:** `app/cookies/page.tsx`

**O que fazer:**
Na tabela de cookies (seção 5), adicionar uma linha para Vercel Analytics:

| Cookie               | Finalidade                                 | Duração | Provedor |
| -------------------- | ------------------------------------------ | ------- | -------- |
| `va_*` / `_vercel_*` | Analytics (páginas visitadas, performance) | Sessão  | Vercel   |

Na seção 2 (Tipos de cookies), ajustar o texto de análise:

- De: "Os dados são agregados e anônimos"
- Para: "Os dados são agregados. O endereço IP pode ser temporariamente processado para geolocalização, mas não é armazenado de forma identificável."

**Justificativa:** Vercel Analytics pode processar IP para geo. Dizer "anônimos" sem ressalva pode ser impreciso.

---

### TAREFA 3 — Renomear "Política de Transparência" → "Sobre o Serviço"

**Arquivos a alterar:**

1. `app/politica/page.tsx` — título da página
2. `components/footer.tsx` — link no NAV.legal
3. `app/termos/page.tsx` — referência na seção 13
4. `app/politica/page.tsx` — subtítulo e referências internas

**O que fazer:**

- Trocar "Política de Transparência" por "Sobre o Serviço" em todos os pontos
- Manter a URL `/politica` (não quebrar links)
- Ajustar o subtítulo de "Informações claras para sua confiança" para "O que está incluso no seu plano"

**Justificativa:** "Política de Transparência" confunde com "Política de Privacidade". "Sobre o Serviço" é mais claro e direto sobre o conteúdo real da página (hospedagem, domínio, o que está incluso).

---

### TAREFA 4 — Atualizar SESSAO_PROXIMA.md com status real

**Arquivo:** `docs/SESSAO_PROXIMA.md`

**O que fazer:**
Marcar como concluídas as tarefas que já foram resolvidas:

- [x] Confirmar emails de contato funcionais → resolvido (zairyx.ai@gmail.com)
- [x] Nomear DPO → resolvido (Tiago, não publicado)
- Mover "CNPJ" e "endereço" para nota: "Tiago opera como PF (CPF). Dados não publicados por decisão do titular."

---

## REGRAS DE EXECUÇÃO

1. **Ler cada arquivo ANTES de editar** — os arquivos podem ter sido formatados desde a última sessão.
2. **Não adicionar dados pessoais** (CPF, endereço, nome completo) em nenhuma página pública.
3. **Manter consistência visual** — usar os mesmos padrões de classes Tailwind já existentes.
4. **Rodar `npm test` após todas as edições** para confirmar que nada quebrou.
5. **Commit com título Title Case** seguindo o padrão: `Fix: Descrição Curta Em Title Case`.
6. **Push para `rename/cardapio-digital`** para trigger de deploy automático na Vercel.
