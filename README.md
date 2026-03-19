<div align="center">

# Cardápio Digital

**Plataforma SaaS white-label de cardápio digital para food-service**

[![CI](https://github.com/TiagoIA-UX/Cardapio-Digital/actions/workflows/ci.yml/badge.svg)](https://github.com/TiagoIA-UX/Cardapio-Digital/actions/workflows/ci.yml)
[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/demo-zairyx.com-brightgreen)](https://zairyx.com)

[Demo ao Vivo](https://zairyx.com) · [Documentação](docs/) · [Licença Comercial](mailto:tiago@tiagoia.dev)

</div>

---

## Visão Geral

Cardápio Digital é uma plataforma SaaS B2B que entrega sites prontos de cardápio digital para restaurantes, pizzarias e outros negócios de alimentação. O operador escolhe um template, personaliza o visual e publica em minutos, com pedidos integrados a WhatsApp e pagamento via Mercado Pago.

**Demo ao vivo:** [https://zairyx.com](https://zairyx.com)

## Funcionalidades Principais

| Módulo                       | Descrição                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **15 Templates por Nicho**   | Restaurante, Pizzaria, Lanchonete, Bar, Cafeteria, Açaí, Sushi, Adega, Mercadinho, Padaria, Sorveteria, Açougue, Hortifruti, Pet Shop, Doceria |
| **Painel do Operador**       | Cadastro de produtos, categorias, identidade visual, banner, cores e configurações                                                             |
| **Pedidos WhatsApp**         | Pedido online com envio estruturado direto para o WhatsApp do restaurante                                                                      |
| **QR Code por Mesa**         | Geração de QR Code para atendimento local                                                                                                      |
| **Checkout Mercado Pago**    | Integração completa com modo sandbox e produção                                                                                                |
| **Sistema de Afiliados**     | 6 tiers progressivos (Bronze → Diamante), comissões automáticas, PIX obrigatório                                                               |
| **Suporte com SLA**          | Tickets de suporte com prioridade, SLA cronometrado e painel admin                                                                             |
| **Marketplace Freelancer**   | Contratação de freelancers com tabela de preços, fluxo de revisão e controle de acesso                                                         |
| **Penalidades Progressivas** | Sistema de strikes com perda automática de clientes sem suporte                                                                                |
| **Painel Admin**             | Gestão de vendas, afiliados, suporte, freelancers, logs e métricas                                                                             |
| **Chatbot IA**               | Atendimento automatizado com Groq (LLaMA 3.3 70B)                                                                                              |
| **CDN de Imagens**           | Upload via Cloudflare R2 com cache distribuído                                                                                                 |
| **Rate Limiting**            | Proteção de APIs com Upstash Redis                                                                                                             |
| **Autenticação**             | Supabase Auth com email verification, hierarquia admin (owner/admin/viewer)                                                                    |
| **Segurança**                | RLS em todas as tabelas, SECURITY DEFINER views, search_path hardening                                                                         |
| **Cron Jobs**                | Verificação diária de SLA e expiração de acessos freelancer                                                                                    |

## Stack Técnica

| Camada           | Tecnologia                             |
| ---------------- | -------------------------------------- |
| Framework        | Next.js 16 (App Router)                |
| Frontend         | React 19, Tailwind CSS 4, Radix UI     |
| Backend          | Next.js API Routes, Server Actions     |
| Banco de Dados   | Supabase (PostgreSQL) — 27+ migrations |
| Autenticação     | Supabase Auth + middleware customizado |
| Pagamento        | Mercado Pago (checkout, webhooks)      |
| IA               | Groq SDK (LLaMA 3.3 70B)               |
| Storage          | Cloudflare R2 (S3-compatible)          |
| Cache/Rate Limit | Upstash Redis                          |
| CI/CD            | GitHub Actions + Vercel auto-deploy    |
| Linguagem        | TypeScript 5 (strict)                  |

## Arquitetura

```
app/                  → Rotas (pages + API routes)
  admin/              → Painel administrativo
  api/                → Endpoints REST
  auth/               → Fluxo de autenticação
  templates/          → Preview e compra de templates
components/           → Componentes React reutilizáveis
lib/                  → Utilitários, integrações e config
services/             → Camada de serviços e regras de negócio
modules/              → Módulos isolados (QR Code, WhatsApp)
store/                → Estado global (Zustand)
supabase/migrations/  → 27+ migrations SQL incrementais
types/                → Tipos TypeScript
hooks/                → React hooks customizados
scripts/              → Scripts de automação e testes
```

## Começar Rápido

```bash
# 1. Clone o repositório
git clone https://github.com/TiagoIA-UX/Cardapio-Digital.git
cd Cardapio-Digital

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
npm run setup:local    # Cria .env.local a partir do exemplo

# 4. Valide a configuração
npm run doctor

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Para checkout com Mercado Pago local: `npm run dev:https`

## Scripts

| Comando               | Descrição                      |
| --------------------- | ------------------------------ |
| `npm run dev`         | Servidor de desenvolvimento    |
| `npm run dev:https`   | Dev com HTTPS (Mercado Pago)   |
| `npm run dev:checked` | Valida ambiente + dev          |
| `npm run build`       | Build de produção              |
| `npm run doctor`      | Verifica variáveis de ambiente |
| `npm run audit:full`  | Build + lint + testes          |
| `npm run ship:all`    | Pipeline completo de deploy    |
| `npm test`            | Executa testes                 |

## Deploy

O projeto faz deploy automático na Vercel ao fazer merge em `main`:

1. Rode `npm run audit:full`
2. Valide com `npm run doctor`
3. Crie o PR e faça merge em `main`
4. Vercel faz deploy automático

**Produção:** [https://zairyx.com](https://zairyx.com)

## Documentação

| Doc                                | Descrição                       |
| ---------------------------------- | ------------------------------- |
| [INSTALL.md](INSTALL.md)           | Guia de instalação e publicação |
| [SETUP_SAAS.md](SETUP_SAAS.md)     | Referência operacional SaaS     |
| [SAAS_ROADMAP.md](SAAS_ROADMAP.md) | Roadmap de produto              |
| [SECURITY.md](SECURITY.md)         | Política de segurança           |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guia de contribuição            |
| [docs/](docs/)                     | Documentação técnica completa   |

## Segurança

Encontrou uma vulnerabilidade? Veja [SECURITY.md](SECURITY.md) para instruções de reporte responsável.

## Licença

Este projeto é licenciado sob a **Business Source License 1.1 (BSL)**.

- **Uso não-comercial**: livre para desenvolvimento, estudo e uso pessoal
- **Uso comercial**: requer licença comercial — contato: [tiago@tiagoia.dev](mailto:tiago@tiagoia.dev)
- **Conversão**: em 2030-03-19, converte automaticamente para Apache 2.0

Veja [LICENSE](LICENSE) para os termos completos.

## Contato

- **Email:** tiago@tiagoia.dev
- **Site:** [https://zairyx.com](https://zairyx.com)

---

<div align="center">

**Cardápio Digital** © 2024-2026 Tiago Aureliano da Rocha

</div>
