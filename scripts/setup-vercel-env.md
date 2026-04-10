# Configuração de Environment Variables na Vercel — PRODUÇÃO

## 📋 Checklist de Variáveis Obrigatórias

Configure estas variáveis diretamente no painel da Vercel:
**https://vercel.com/tiago-aureliano-da-rochas-projects/cardapio-digital/settings/environment-variables**

### 🔴 CRÍTICAS (sem estas, o sistema NÃO funciona)

| Variável | Valor | Ambiente | Descrição |
|----------|-------|----------|-----------|
| `NEXT_PUBLIC_SITE_URL` | `https://zairyx.com.br` | Production | URL pública do site |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rgphffvugmkeyyxiwjvv.supabase.co` | Production, Preview | URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_vEheb0hZ-RBF-1JvQJXpoQ_RV7nXDoN` | Production, Preview | Chave pública Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ **Copiar do .env.local** | Production | Service role key (SECRET) |
| `MERCADO_PAGO_ENV` | `production` | Production | **Modo produção** |
| `NEXT_PUBLIC_MERCADO_PAGO_ENV` | `production` | Production | Controle frontend |
| `MERCADO_PAGO_ACCESS_TOKEN` | ⚠️ **Copiar do .env.local** | Production | Token produção MP |
| `MERCADO_PAGO_PUBLIC_KEY` | ⚠️ **Copiar do .env.local** | Production | Public key MP |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | ⚠️ **Copiar do .env.local** | Production | Public key MP (frontend) |
| `MP_WEBHOOK_SECRET` | ⚠️ **Copiar do .env.local** | Production | Validação webhooks MP |
| `ADMIN_SECRET_KEY` | ⚠️ **Copiar do .env.local** | Production | Autenticação admin |
| `INTERNAL_API_SECRET` | ⚠️ **Copiar do .env.local** | Production | API interna |
| `CRON_SECRET` | ⚠️ **Copiar do .env.local** | Production | Proteção rotas /api/cron |
| `GROQ_API_KEY` | ⚠️ **Copiar do .env.local** | Production | IA do chatbot/ForgeOps |

### 🟡 IMPORTANTES (features podem quebrar sem elas)

| Variável | Valor | Ambiente | Descrição |
|----------|-------|----------|-----------|
| `R2_PUBLIC_URL` | `https://cdn.zairyx.com` | Production | CDN Cloudflare R2 |
| `R2_ACCOUNT_ID` | ⚠️ **Copiar do .env.local** | Production | Cloudflare account |
| `R2_ACCESS_KEY_ID` | ⚠️ **Copiar do .env.local** | Production | R2 access key |
| `R2_SECRET_ACCESS_KEY` | ⚠️ **Copiar do .env.local** | Production | R2 secret |
| `R2_BUCKET_NAME` | `cardapio-digital` | Production | Nome do bucket |
| `PEXELS_API_KEY` | ⚠️ **Copiar do .env.local** | Production | Imagens de produtos |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ⚠️ **Copiar do .env.local** | Production | Google Search Console |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | ⚠️ **Copiar do .env.local** | Production | GSC private key |
| `GOOGLE_SITE_URL` | `https://www.zairyx.com` | Production | URL para GSC |
| `TELEGRAM_BOT_TOKEN` | ⚠️ **Copiar do .env.local** | Production | ForgeOps Sentinel bot |
| `TELEGRAM_CHAT_ID` | ⚠️ **Copiar do .env.local** | Production | Chat ID do owner |

### 🟢 OPCIONAIS (desenvolvimento/testes)

| Variável | Valor | Ambiente | Descrição |
|----------|-------|----------|-----------|
| `ALLOW_DEV_UNLOCK` | `false` | Production | Liberar templates dev (SEMPRE false) |
| `NEXT_PUBLIC_ALLOW_DEV_UNLOCK` | `false` | Production | Frontend dev unlock |
| `MERCADO_PAGO_TEST_ACCESS_TOKEN` | ⚠️ **Copiar do .env.local** | Preview, Development | Sandbox token |
| `MERCADO_PAGO_TEST_PUBLIC_KEY` | ⚠️ **Copiar do .env.local** | Preview, Development | Sandbox public key |
| `NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY` | ⚠️ **Copiar do .env.local** | Preview, Development | Sandbox frontend |

### ⚠️ NUNCA ADICIONAR NA VERCEL

Estas variáveis ficam APENAS no `.env.local` (localhost):

- `VERCEL_TOKEN` — token pessoal, não deve estar no cloud
- `GITHUB_TOKEN` — token pessoal local
- `VERCEL_ORG_ID` — gerado automaticamente
- `VERCEL_PROJECT_ID` — gerado automaticamente
- `RENDER_API_KEY` — backend Python separado
- `FORGE_GITHUB_*` — app ForgeOps AI (outro projeto)

---

## 🚀 Como Configurar (Passo a Passo)

### Opção 1: Painel Web (Recomendado)

1. Acesse: https://vercel.com/tiago-aureliano-da-rochas-projects/cardapio-digital/settings/environment-variables
2. Para cada variável da lista CRÍTICA:
   - Clique em "Add New"
   - Name: nome da variável (ex: `GROQ_API_KEY`)
   - Value: valor correspondente
   - Environment: selecione **Production** (e Preview se necessário)
   - Clique "Save"
3. Após adicionar todas, faça um novo deploy:
   ```bash
   git commit --allow-empty -m "trigger deploy with new env vars"
   git push origin main
   ```

### Opção 2: Vercel CLI (CUIDADO - leia §8 do copilot-instructions.md)

⚠️ **NÃO use `vercel env pull` ou `vercel deploy`** — sobrescreve `.env.local`

Permitido apenas:
```bash
vercel env add NOME_VARIAVEL production
# Será solicitado o valor
```

---

## ✅ Validação Pós-Deploy

Após configurar e fazer deploy, rode:

```bash
npm run doctor
```

Deve retornar:
- ✅ Supabase conectado
- ✅ Mercado Pago (production mode)
- ✅ Admin auth configurado
- ✅ R2 storage acessível
- ✅ Groq API respondendo

---

## 📊 Status Atual

- **Ambiente Local**: ✅ `.env.local` completo (200+ linhas)
- **Ambiente Vercel**: ⚠️ Precisa configurar variáveis de produção
- **Deploy**: ✅ GitHub Integration ativa (auto-deploy no push)
- **Commits recentes**:
  - `73eb211` — Proteção Vercel CLI
  - `0c8c389` — Trigger auto-deploy
  - `790271f` — ForgeOps orthography scanning

---

## 🔐 Segurança

- ✅ `.env.local` no `.gitignore` (não vai para GitHub)
- ✅ Backups automáticos em `.env-backups/`
- ✅ Script `protect-env.ps1` ativo
- ✅ Vercel CLI deploy **PROIBIDO** (§8 do copilot-instructions.md)
- ✅ Deploy via GitHub Integration (seguro)
