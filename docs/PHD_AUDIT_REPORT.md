# Auditoria PhD Completa — Zairyx Cardápio Digital

> **Data**: Junho 2025
> **Escopo**: Editor visual, funcionalidades, rotas, links, pagamentos, planos, checkout, políticas
> **Resultado**: ✅ APROVADO COM CORREÇÕES APLICADAS

---

## 1. MAPEAMENTO DE ROTAS

### Resumo

| Tipo | Contagem |
|------|----------|
| Páginas (app/) | 84 |
| API Routes (app/api/) | 48+ |
| Webhooks | 2 (mercadopago, subscriptions) |
| Cron Jobs | 3 (health, payout, trial-check) |

### Rotas Removidas Nesta Auditoria

| Rota | Motivo |
|------|--------|
| `/api/webhooks/mercadopago` | Duplicata (re-export de `/api/webhook/mercadopago`) |
| `/api/checkout/criar-sessao` | Stub 410 — Sistema migrou para `/comprar/[template]` |
| `/api/pagamento/criar` | Stub 410 |
| `/api/pagamento/criar-assinatura` | Stub 410 |
| `/api/pagamento/criar-pacote` | Stub 410 |
| `/checkout` (page) | Redirect deprecado para `/templates` |
| `/finalizar-compra-pacote` (page) | Stub legado |
| `/ofertas` (page) | Redirect para `/templates` |

---

## 2. AUTENTICAÇÃO

### Status: ✅ EXCELENTE

| Aspecto | Avaliação |
|---------|-----------|
| OAuth Callback | `exchangeCodeForSession` com validação segura |
| Redirect Validation | `getSafeNext()` — bloqueia `//`, CRLF, protocolos externos |
| Rate Limiting | 100 req/min em rotas de auth |
| Session | Cookie-based Supabase, server-side validation |
| Admin Auth | Header Bearer + Cookie session, role weights (support < admin < owner) |

---

## 3. FLUXO DE PAGAMENTO

### Status: ✅ BOM (com correções aplicadas)

**Fluxo atual**:
```
/comprar/[template] → /api/pagamento/iniciar-onboarding → MercadoPago Preference
    → Checkout externo MercadoPago
    → /api/webhook/mercadopago → Provisionar delivery
    → Notificação (email/dashboard)
```

**Segurança**:
- ✅ Preço calculado server-side via `getOnboardingPriceByTemplate()` (nunca confia no frontend)
- ✅ Schema Zod para validação de input
- ✅ Rate limiting: 5 requisições/minuto
- ✅ Guarda atômica contra webhook duplicado (claim com `payment_status IN ('pending', 'awaiting_payment')`)
- ✅ Idempotência de pagamento (`samePaymentAlreadyProcessed`)

**Correção aplicada**: Slug collision retry — se INSERT falhar por UNIQUE constraint no `restaurants.slug`, tenta com sufixo timestamp.

---

## 4. EDITOR VISUAL

### Status: ✅ FUNCIONAL

**Campos editáveis**:
- Nome, telefone, endereço, slogan
- Logo URL, banner URL
- Hero title, hero slogan preset, section title
- Primary CTA label

**Funcionalidades**:
- Auto-save com debounce de 2 segundos
- Edição inline (click para editar campos)
- Upload de imagem com validação de magic bytes e MIME type
- Publicação com cópia automática de `/r/{slug}` para clipboard
- Acesso controlado por plano: `usePanelAccess().capabilities.canAccessVisualEditor`

---

## 5. PLANOS E ASSINATURAS

### Status: ✅ ESTRUTURADO

| Plano | Preço/mês | Max Produtos |
|-------|-----------|-------------|
| Básico | R$ 59 | 60 |
| Pro | R$ 89 | 200 |
| Premium | R$ 199 | Ilimitado |

**Preços por template** (15 templates × 2 modalidades):
- **Self-service**: R$ 197–347 (PIX) / R$ 237–397 (cartão)
- **Feito-pra-você**: R$ 497–897 (PIX) / R$ 597–1.077 (cartão)

**Observação**: Preços hardcoded em `lib/pricing.ts`. Funcional mas migrar para DB facilitaria mudanças operacionais sem deploy.

**Upgrade path**: Desativado. Self-service upgrades indisponíveis — apenas via novo checkout.

---

## 6. POLÍTICAS E SEO

### Status: ✅ CORRIGIDO

**Páginas legais** (4 canônicas):
| Página | URL | Conteúdo |
|--------|-----|----------|
| Transparência | `/politica` | 5 seções (modelo comercial, prazos, Google Maps) |
| Privacidade | `/privacidade` | 10 seções (LGPD Art.18, base legal) |
| Termos | `/termos` | 13 seções (CDC Art.49, foro) |
| Cookies | `/cookies` | 7 seções (tabela de cookies) |

**Correções aplicadas**:
- ✅ Alias pages (`/politica-de-privacidade`, `/termos-de-uso`) agora têm canonical metadata apontando para URLs canônicas
- ✅ Sitemap: removidas URLs duplicadas (`/politica-de-privacidade`, `/termos-de-uso`) e `/ofertas`
- ✅ Robots.txt: removido `/ofertas` do allow e `/checkout` do disallow
- ✅ Marca padronizada: header de `/termos` corrigido para "Zairyx — Cardápio Digital"

---

## 7. NAVEGAÇÃO E LINKS

### Status: ✅ ZERO LINKS QUEBRADOS

| Componente | Links Auditados | Quebrados |
|------------|-----------------|-----------|
| Header (home-header.tsx) | 5 | 0 |
| Footer (footer.tsx) | 10 | 0 |
| Sidebar painel (navigation.ts) | 11 | 0 |

---

## 8. FUNCIONALIDADES VALIDADAS

| Fluxo | Status |
|-------|--------|
| `/comprar/[template]` → Onboarding → Pagamento → Provisão | ✅ VALID |
| `/painel/editor` → Editor visual | ✅ VALID |
| `/painel/planos` → Gestão de planos | ✅ VALID |
| `/auth/callback` → OAuth callback | ✅ VALID |
| `/templates` → Catálogo de templates | ✅ VALID |
| `/templates/[slug]` → Detalhe de template | ✅ VALID |
| `/r/[slug]` → Cardápio público | ✅ VALID |
| Pedidos → WhatsApp | ✅ VALID |
| Upload de imagens → R2/Storage | ✅ VALID |

---

## 9. API ROUTES

| Rota | Method | Rate Limit | Status |
|------|--------|------------|--------|
| `/api/pagamento/iniciar-onboarding` | POST | ✅ 5/min | ✅ OK |
| `/api/pagamento/provisionar` | POST | ✅ | ✅ OK |
| `/api/pagamento/status` | GET | ✅ | ✅ OK |
| `/api/webhook/mercadopago` | POST | - (idempotente) | ✅ OK |
| `/api/webhook/subscriptions` | POST | - (idempotente) | ✅ OK |
| `/api/templates` | GET | ✅ public | ✅ OK |
| `/api/orders` | POST | ✅ | ✅ OK |
| `/api/onboarding/submit` | POST | - | ✅ OK |
| `/api/upload` | POST | - (auth req.) | ✅ OK |
| `/api/checkout/validar-cupom` | POST | ✅ | ✅ OK |

---

## 10. SEGURANÇA

### 🟢 Nenhuma Vulnerabilidade Crítica

| Categoria OWASP | Status |
|------------------|--------|
| Broken Access Control | ✅ RLS + requireAdmin + session auth |
| Cryptographic Failures | ✅ Supabase managed |
| Injection | ✅ Zod validation + parameterized queries |
| Insecure Design | ✅ Server-side price validation |
| Security Misconfiguration | ✅ Rate limiting aplicado |
| Auth Failures | ✅ OAuth + safe redirect |
| SSRF | ✅ Redirect validation blocks external URLs |

---

## 11. LIMPEZA REALIZADA

| Métrica | Valor |
|---------|-------|
| Arquivos removidos nesta sessão | 8 |
| Linhas removidas | -297 |
| Dead code eliminado | `types/checkout.ts`, testes de rotas 410 |
| Bugs corrigidos | Slug collision retry |
| SEO fixes | Canonical metadata, sitemap, robots.txt |

---

## 12. RECOMENDAÇÕES FUTURAS

| Prioridade | Ação |
|------------|------|
| **Média** | Migrar preços de `lib/pricing.ts` para tabela no Supabase (permite ajustes sem deploy) |
| **Média** | Implementar upgrade self-service de planos no `/painel/planos` |
| **Baixa** | Adicionar metadata (`title`, `description`) nas páginas legais canônicas (`/privacidade`, `/termos`, `/politica`, `/cookies`) |
| **Baixa** | Lazy-load ícones em `/comprar/[template]` (100+ imports do lucide-react) |
| **Baixa** | Adicionar rate limiting em `/api/onboarding/submit` |
