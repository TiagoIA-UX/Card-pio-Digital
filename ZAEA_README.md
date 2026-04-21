# ForgeOps AI — Autonomous Engineering Agent

![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square) ![Stack](https://img.shields.io/badge/Stack-Next.js_15_%2B_Supabase-black?style=flat-square&logo=nextdotjs) ![AI](https://img.shields.io/badge/AI-Groq_llama--3.3--70b-orange?style=flat-square) ![Alerts](https://img.shields.io/badge/Alerts-Telegram-blue?style=flat-square&logo=telegram) ![CI](https://img.shields.io/badge/CI-GitHub_Actions-black?style=flat-square&logo=githubactions) ![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)

> **ForgeOps AI** é um sistema de agentes de engenharia de software com detecção de defeitos operacionais, monitoramento, diagnóstico e validação para plataformas Next.js + Supabase — para transformar falhas em eventos rastreáveis e resolvidos em minutos.

---

## Visão geral

```text
┌─────────────────────────────────────────────┐
│  MAESTRO            │  FORGE (este repo)     │
│  Chat AI Orchestrator│  TI/DevOps Orchestrator│
│  → Zai IA            │  → Scanner             │
│  → Suporte           │  → Surgeon             │
│  → Prospecção        │  → Validator           │
│  → Onboarding        │  → Sentinel            │
└─────────────────────────────────────────────┘
```

### Os dois orquestradores

| Nome        | Função                                   | Tecnologia                       |
| ----------- | ---------------------------------------- | -------------------------------- |
| **Maestro** | Orquestra agentes de conversação e IA    | Groq + Supabase + WebSockets     |
| **Forge**   | Orquestra agentes de engenharia e DevOps | GitHub Actions + Groq + Supabase |

---

## Agentes do sistema ForgeOps AI

| Agente           | Função                                                                                  | Trigger                       |
| ---------------- | --------------------------------------------------------------------------------------- | ----------------------------- |
| **Scanner**      | Detecta defeitos operacionais em TypeScript, lint, build, runtime e sinais de regressão | Cron 10min                    |
| **Surgeon**      | Gera correções seguras para falhas triviais com revisão via PR                          | Pós-Scanner (erro encontrado) |
| **Validator**    | Valida correções antes do merge em produção                                             | Pós-Surgeon                   |
| **Sentinel**     | Monitora alertas e notifica via Telegram                                                | Contínuo (Python + Vercel)    |
| **Orchestrator** | Coordena todos os agentes                                                               | Sempre                        |

### Classificação de risco

```text
SAFE     → Forge sugere/aplica correção segura + PR para revisão
MODERATE → Forge cria branch + aguarda aprovação
RISKY    → Forge documenta + escala para humano via Telegram
```

---

## Stack técnica

```text
GitHub Actions     — Runner gratuito (2000min/mês) + cron scheduler
Groq llama-3.3-70b — Análise, diagnóstico e sugestões de patch
Supabase           — agent_tasks + agent_knowledge (base evolutiva)
Telegram Bot       — Alertas em tempo real (@ForgeOpsBot)
Next.js 15         — API routes + admin dashboard
Python FastAPI     — ForgeOps Sentinel local (backend/server.py)
```

---

## Database Schema

```sql
-- Fila de tarefas dos agentes
agent_tasks (
  id           UUID PRIMARY KEY,
  agent_name   TEXT  -- scanner|surgeon|validator|forgeops|sentinel|orchestrator
  status       TEXT  -- pending|running|completed|failed|escalated
  priority     TEXT  -- p0|p1|p2
  task_type    TEXT,
  input        JSONB,
  output       JSONB,
  github_pr_url TEXT,
  triggered_by  TEXT  -- cron|alert|manual|cascade
)

-- Base de conhecimento evolutiva
agent_knowledge (
  id          UUID PRIMARY KEY,
  pattern     TEXT,   -- padrão de erro identificado
  root_cause  TEXT,   -- causa raiz
  solution    TEXT,   -- solução aplicada
  confidence  INT,    -- 0-100%
  outcome     TEXT,   -- success|failed|escalated|partial
  occurrences INT     -- quantas vezes este padrão foi visto
)
```

---

## Workflow GitHub Actions

```yaml
# .github/workflows/forgeops.yml
# Rodado a cada 10 minutos
on:
  schedule:
    - cron: '*/10 * * * *'
  workflow_dispatch:
    inputs:
      mode: [scan, fix, full]

jobs: scanner → surgeon → notifier
```

### Secrets necessários

| Secret                          | Descrição                          |
| ------------------------------- | ---------------------------------- |
| `GROQ_API_KEY`                  | Motor de IA para análise e patches |
| `SUPABASE_SERVICE_ROLE_KEY`     | Acesso ao banco de tarefas         |
| `TELEGRAM_BOT_TOKEN`            | Bot de alertas                     |
| `TELEGRAM_CHAT_ID`              | Chat de destino dos alertas        |
| `INTERNAL_API_SECRET`           | Autenticação interna da API        |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase             |

---

## API

```http
POST /api/agents/dispatch
Authorization: Bearer {INTERNAL_API_SECRET}

Body: {
  "agent": "scanner",
  "taskType": "quality_scan",
  "priority": "p1",
  "input": { "sha": "abc123" }
}

Response: { "success": true, "taskId": "uuid..." }
```

```http
GET /api/agents/dispatch?agent=scanner&status=failed&hours=24
Authorization: Bearer {INTERNAL_API_SECRET}

Response: { tasks: [...], knowledge: [...], stats: {...} }
```

---

## Admin Dashboard

Acesse em `/admin/agentes`:

- Cards de saúde por agente (Scanner, Surgeon, Validator, Sentinel, Orchestrator)
- Lista de tarefas com status em tempo real
- Base de conhecimento com confiança e histórico
- Filtros por agente, status e período

---

## Restrições absolutas (hard limits)

O Surgeon **nunca** toca em:

- Arquivos de pagamento (`payment`, `checkout`)
- Migrations SQL
- Arquivos de teste
- pasta `supabase/`
- Commits diretos em `main` sem passar pelo CI

---

## Estrutura de arquivos principais

```text
lib/orchestrator.ts              → Forge: dispatchTask, recordOutcome, getKnowledge
backend/server.py                → ForgeOps Sentinel Python agent (local + Docker)
.github/workflows/forgeops.yml   → Pipeline Scanner → Surgeon → Notifier
app/api/agents/dispatch/route.ts → API REST para despacho de tarefas
app/admin/agentes/page.tsx       → Dashboard visual
supabase/migrations/047_agent_system.sql → Schema das tabelas
```

---

## Filosofia

> "Seu sistema nunca será perfeito, mas sua operação pode ser totalmente controlável quando falhar."  
> — ForgeOps AI foi construído para reduzir tempo de diagnóstico e evitar operação no escuro.

---

## Licença

MIT © 2026 Zairyx / TiagoIA-UX
