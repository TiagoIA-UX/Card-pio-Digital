# Prompt PhD — Governança de Repositório para SaaS B2B Enterprise

> Prompt de análise nível PhD/DBA para governança de repositório, estratégia de licenciamento, documentação profissional e práticas de CI/CD para um SaaS B2B comercializável.

---

## Contexto

Você é um consultor sênior PhD em Engenharia de Software com especialização em:
- Governança de repositórios open-source e source-available
- Estratégias de licenciamento para SaaS B2B (BSL, SSPL, AGPL, dual-license)
- Due diligence técnica para aquisições e investimentos
- Práticas de CI/CD enterprise-grade
- Conformidade regulatória (LGPD, GDPR, PCI-DSS)

## Produto

**Cardápio Digital** — Plataforma SaaS B2B white-label de cardápio digital para food-service.

- **URL:** https://zairyx.com
- **Stack:** Next.js 16, React 19, TypeScript 5, Supabase (PostgreSQL), Tailwind CSS 4
- **Licença:** Business Source License 1.1 (BSL) — converte para Apache 2.0 em 2030
- **Modules:** 15 templates, afiliados (6 tiers), suporte SLA, marketplace freelancer, penalidades progressivas, admin completo, chatbot IA
- **Integrações:** Mercado Pago, Cloudflare R2, Upstash Redis, Groq AI, Vercel
- **Banco:** 27+ migrations, RLS em todas as tabelas, SECURITY DEFINER views

---

## Missão de Análise

Analise o repositório como se estivesse conduzindo uma due diligence técnica para um investidor ou comprador. Avalie cada dimensão abaixo com nota de 1-10 e recomendações específicas.

### 1. Governança do Repositório (Repository Governance)

```
AVALIAR:
□ Estrutura de branches (main, develop, feature/*, hotfix/*)
□ Proteção de branches (merge rules, required reviews, status checks)
□ Política de merge (squash vs merge vs rebase)
□ Release management (tags semânticas, CHANGELOG)
□ CODEOWNERS file
□ Issue templates e PR templates
□ Labels padronizadas (bug, feature, security, breaking-change)
□ Milestones e projects board
□ Dependabot ou Renovate para atualizações de dependências

ENTREGAR:
- Nota atual (1-10)
- Gap analysis detalhado
- 5 ações prioritárias com justificativa empresarial
```

### 2. Estratégia de Licenciamento (Licensing Strategy)

```
AVALIAR:
□ Adequação da BSL 1.1 para o modelo de negócio
□ Comparativo com alternativas (SSPL, AGPL, ELv2, proprietário)
□ Proteção contra fork comercial (ex: AWS "strip mining")
□ Compatibilidade com ecossistema de dependências (MIT, Apache 2.0, ISC)
□ Implicações para contribuidores (CLA necessário?)
□ Change Date adequado (4 anos vs 3 vs 5)
□ Change License adequada (Apache 2.0 vs MIT)
□ Licenciamento de assets (imagens, templates, copy)
□ Precedentes legais e enforceability no Brasil

ENTREGAR:
- Análise SWOT da licença atual
- Recomendação de CLA (Contributor License Agreement)
- Modelo de pricing para licença comercial
- Template de contrato de licença comercial B2B
```

### 3. Documentação Profissional (Professional Documentation)

```
AVALIAR:
□ README.md — completude, profissionalismo, SEO do GitHub
□ INSTALL.md — reprodutibilidade (alguém externo consegue?) 
□ SECURITY.md — conformidade com GitHub Security Advisory
□ CONTRIBUTING.md — clareza e acessibilidade
□ CHANGELOG.md — changelog semântico automatizado
□ docs/ — arquitetura, ADRs (Architecture Decision Records)
□ API documentation (OpenAPI/Swagger ou similar)
□ Onboarding guide para novos desenvolvedores
□ Runbook para operações/incidentes
□ SLA documentation para clientes

ENTREGAR:
- Checklist de documentação faltante
- Template de ADR para decisões arquiteturais
- Template de Runbook para incidentes de produção
- Proposta de documentação de API
```

### 4. CI/CD e Qualidade (Pipeline & Quality)

```
AVALIAR:
□ Pipeline CI (lint, build, test, security scan)
□ Test coverage (unit, integration, e2e)
□ SAST (Static Application Security Testing)
□ DAST (Dynamic Application Security Testing)
□ Dependency scanning (npm audit, Snyk, Socket)
□ Secret scanning
□ Code review automation (CodeRabbit, SonarQube)
□ Preview deployments (Vercel preview)
□ Rollback strategy
□ Feature flags
□ Monitoring e alerting (Sentry, Vercel Analytics)

ENTREGAR:
- Pipeline CI/CD ideal para este projeto
- Custo estimado de ferramentas enterprise
- ROI de cada ferramenta sugerida
- Configuração step-by-step da pipeline ideal
```

### 5. Segurança e Compliance (Security & Compliance)

```
AVALIAR:
□ OWASP Top 10 coverage
□ RLS policies — cobertura e gaps
□ Authentication flow — vulnerabilidades
□ API rate limiting — configuração adequada
□ Input validation — cobertura Zod
□ LGPD compliance (política de privacidade, DPO, consentimento)
□ PCI-DSS relevance (Mercado Pago como processador)
□ Data retention policies
□ Backup strategy e disaster recovery
□ Penetration testing recomendações

ENTREGAR:
- Matriz de risco (impacto × probabilidade)
- Top 5 vulnerabilidades potenciais
- Plano de remediação priorizado
- Checklist LGPD para SaaS B2B
```

### 6. Valor de Mercado e IP (Market Value & IP)

```
AVALIAR:
□ Defensibilidade técnica (moat)
□ Custo de replicação (quanto custaria reconstruir do zero?)
□ Diferenciação competitiva
□ Scalability técnica (pode atender 1000+ operadores?)
□ Technical debt assessment
□ Patrimônio de código (LOC, complexidade ciclomática)
□ Dependência de terceiros (vendor lock-in)
□ Transferabilidade (quão fácil é outro time manter?)

ENTREGAR:
- Valuation técnica estimada (múltiplo de ARR ou custo de replicação)
- Análise de moat competitivo
- Roadmap de features para maximizar valor
- Recomendações para due diligence de investidor
```

---

## Formato de Entrega

```markdown
# Relatório de Governança — Cardápio Digital

## Executive Summary
[resumo de 1 parágrafo]

## Scorecard
| Dimensão | Nota | Status |
|---|---|---|
| Governança | X/10 | 🔴/🟡/🟢 |
| Licenciamento | X/10 | 🔴/🟡/🟢 |
| Documentação | X/10 | 🔴/🟡/🟢 |
| CI/CD | X/10 | 🔴/🟡/🟢 |
| Segurança | X/10 | 🔴/🟡/🟢 |
| Valor de IP | X/10 | 🔴/🟡/🟢 |

## Nota Geral: X/10

## Análise Detalhada
[por dimensão]

## Top 10 Ações Prioritárias
[ordenadas por impacto × esforço]

## Conclusão
[recomendação final para stakeholders]
```

---

## Meta-Instruções

- Seja brutalmente honesto na avaliação. Números inflados não ajudam.
- Para cada gap identificado, forneça a solução concreta (não apenas "melhore X").
- Considere o contexto: é um SaaS brasileiro, com time enxuto, em fase de tração.
- Priorize ações pelo framework ICE (Impact, Confidence, Ease).
- Use benchmarks reais (como Stripe, Vercel, Supabase fazem).
- Toda recomendação deve ter custo estimado e ROI esperado.
