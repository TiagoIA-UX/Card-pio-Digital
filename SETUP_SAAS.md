<!-- markdownlint-disable -->

# 🚀 Guia de Setup do SaaS - Cardápio Digital

> Tempo estimado: 10-15 minutos

---

## PARTE 1: Criar Projeto no Supabase (grátis)

### Passo 1.1 - Criar conta

1. Acesse: **https://supabase.com**
2. Clique em **"Start your project"** (botão verde)
3. Faça login com **GitHub** (recomendado) ou email

### Passo 1.2 - Criar novo projeto

1. No Dashboard, clique em **"New project"**
2. Preencha:
   - **Name:** `cardapio-digital`
   - **Database Password:** (anote esta senha!)
   - **Region:** South America (São Paulo) - `sa-east-1`
3. Clique em **"Create new project"**
4. **Aguarde ~2 minutos** até aparecer "Project is ready"

---

## PARTE 2: Copiar as Chaves de API

### Passo 2.1 - Acessar configurações

1. No menu lateral esquerdo, clique no ícone de **engrenagem** ⚙️
2. Clique em **"API"** no submenu

### Passo 2.2 - Copiar as chaves

Você verá 3 informações importantes. Copie cada uma:

| Campo no Supabase                     | Nome da Variável                |
| ------------------------------------- | ------------------------------- |
| **Project URL**                       | `NEXT_PUBLIC_SUPABASE_URL`      |
| **anon public** (em Project API Keys) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** (clique em "Reveal") | `SUPABASE_SERVICE_ROLE_KEY`     |

> ⚠️ **IMPORTANTE:** A `service_role` é secreta! Nunca compartilhe.

---

## PARTE 3: Executar o Schema SQL

### Passo 3.1 - Abrir SQL Editor

1. No menu lateral, clique em **"SQL Editor"** (ícone de código `<>`)
2. Clique em **"+ New query"**

### Passo 3.2 - Colar e executar o schema

1. Abra o arquivo `supabase/schema.sql` do seu projeto
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **Cole no SQL Editor** do Supabase (Ctrl+V)
4. Clique no botão **"Run"** (ou Ctrl+Enter)

### Passo 3.3 - Verificar sucesso

Deve aparecer: `Success. No rows returned`

Para confirmar, vá em **"Table Editor"** no menu lateral. Você deve ver:

- ✅ `restaurants`
- ✅ `products`
- ✅ `orders`
- ✅ `order_items`

---

## PARTE 4: Configurar no Vercel

### Passo 4.1 - Acessar variáveis de ambiente

1. Acesse: **https://vercel.com/dashboard**
2. Clique no seu projeto **Cardapio-Digital**
3. Vá em **"Settings"** (aba superior)
4. Clique em **"Environment Variables"** (menu lateral)

### Passo 4.2 - Adicionar as 3 variáveis

Adicione uma por uma:

**Variável 1:**

- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: (cole a URL do Supabase, ex: `https://xxxxx.supabase.co`)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variável 2:**

- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: (cole a chave anon, começa com `eyJ...`)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variável 3:**

- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: (cole a chave service_role, começa com `eyJ...`)
- Environments: ✅ Production, ✅ Preview, ✅ Development

Clique em **"Save"** após cada uma.

---

## PARTE 5: Redeploy da Aplicação

### Passo 5.1 - Fazer redeploy

1. No Vercel, vá em **"Deployments"** (aba superior)
2. No deploy mais recente, clique nos **3 pontos** (⋮) à direita
3. Clique em **"Redeploy"**
4. Na popup, clique em **"Redeploy"** novamente
5. Aguarde ~1-2 minutos

### Passo 5.2 - Testar o sistema

1. Acesse seu site (ex: `https://cardapio-digital-xxx.vercel.app`)
2. Clique em **"Criar Cardápio"** ou **"Entrar"**
3. Cadastre-se com email/senha
4. Crie seu restaurante
5. Acesse `seusite.com/r/slug-do-restaurante` para ver o cardápio

---

## 🎉 Pronto!

Seu SaaS de Cardápio Digital está funcionando!

### Rotas disponíveis:

| URL                     | Função                 |
| ----------------------- | ---------------------- |
| `/`                     | Landing page           |
| `/login`                | Login/Cadastro         |
| `/painel`               | Dashboard admin        |
| `/painel/produtos`      | Gerenciar produtos     |
| `/painel/pedidos`       | Ver pedidos            |
| `/painel/configuracoes` | Configurar restaurante |
| `/r/[slug]`             | Cardápio público       |

---

## 🔧 Problemas Comuns

### "Erro de autenticação"

- Verifique se copiou as chaves corretamente
- A chave `anon` e `service_role` são diferentes!

### "Tabelas não encontradas"

- Execute o schema.sql novamente no SQL Editor
- Verifique se não cortou nenhuma parte

### "Redeploy não aplicou as mudanças"

- As variáveis de ambiente só são aplicadas após o redeploy
- Faça outro deploy ou aguarde alguns minutos

---

## 📱 Teste Local (Opcional)

Para testar localmente, crie um arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=eyJ...sua-chave-service
```

Depois rode:

```bash
npm run dev
```

Acesse: http://localhost:3000
