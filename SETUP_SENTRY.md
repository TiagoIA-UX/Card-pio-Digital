# 🛡️ Configuração de Monitoramento - Sentry

## Instalação Rápida (5 minutos)

### 1. Criar conta no Sentry

```
1. Acesse https://sentry.io/signup/
2. Crie uma conta gratuita
3. Crie um projeto Next.js
4. Copie o DSN
```

### 2. Configurar variáveis de ambiente

Adicione em `.env.local`:

```env
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
SENTRY_AUTH_TOKEN=sntrys_xxxx

# Opcional: desativar em dev
SENTRY_IGNORE_API_RESOLUTION_ERROR=1
```

### 3. Instalar SDK

```bash
npm install @sentry/nextjs
```

### 4. Executar wizard de configuração

```bash
npx @sentry/wizard@latest -i nextjs
```

O wizard vai:

- Criar `sentry.client.config.ts`
- Criar `sentry.server.config.ts`
- Criar `sentry.edge.config.ts`
- Modificar `next.config.mjs`
- Criar `instrumentation.ts`

### 5. Verificar integração

```bash
npm run build
```

---

## Uso do Error Tracking

### Capturar erro

```typescript
import { captureError } from '@/lib/error-tracking'

try {
  await riskyOperation()
} catch (error) {
  captureError(error, {
    tags: { feature: 'checkout', tenant: 'pizzaria-x' },
    user: { id: userId, tenant_id: tenantId },
  })
}
```

### Adicionar breadcrumb

```typescript
import { addBreadcrumb } from '@/lib/error-tracking'

// Rastrear ação do usuário
addBreadcrumb('Adicionou pizza ao carrinho', 'cart', {
  productId: 'xxx',
  price: 45.9,
})
```

### Definir contexto do usuário

```typescript
import { setUserContext, clearUserContext } from '@/lib/error-tracking'

// Após login
setUserContext({
  id: user.id,
  email: user.email,
  tenant_id: restaurant.id,
})

// Após logout
clearUserContext()
```

---

## Alertas Recomendados

Configure no painel do Sentry:

| Alerta            | Condição               | Ação                   |
| ----------------- | ---------------------- | ---------------------- |
| Erro crítico      | level = fatal          | Email + Slack imediato |
| Spike de erros    | >10 erros/5min         | Email                  |
| Webhook falhou    | tag:feature = webhook  | Email + Slack          |
| Checkout quebrado | tag:feature = checkout | Email + Slack          |

---

## Plano Gratuito do Sentry

| Recurso     | Limite               |
| ----------- | -------------------- |
| Eventos/mês | 5.000                |
| Retenção    | 30 dias              |
| Alertas     | Ilimitados           |
| Integrações | Slack, Email, GitHub |

Suficiente para beta com 2-5 pizzarias.

---

## Monitoramento Local (Sem Sentry)

O arquivo `lib/error-tracking.ts` funciona mesmo sem Sentry configurado:

- Logs estruturados no console
- Buffer local dos últimos 100 erros
- Pode ser consultado via `getLocalErrors()`

```typescript
import { getLocalErrors } from '@/lib/error-tracking'

// Ver erros recentes (debug)
console.log(getLocalErrors())
```

---

## Próximos Passos

1. ✅ Rate limiting implementado
2. ⏳ Configurar Sentry (seguir passos acima)
3. ⏳ Deploy produção
4. ⏳ Onboard 2 pizzarias
