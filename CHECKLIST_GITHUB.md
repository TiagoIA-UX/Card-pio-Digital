# Checklist GitHub — O que verificar (para não-programadores)

Coisas importantes no GitHub que podem passar despercebidas.

---

## 1. Branch padrão (Default branch)

**Onde:** Repositório → **Settings** → **General** → **Default branch**

**O que verificar:** A branch padrão deve ser **main** (ou a branch que a Vercel usa para deploy).

Se estiver **feature/import-chat-app** ou outra, novos PRs vão apontar para ela. Isso pode confundir.

**Ação:** Clique em "Switch to another branch" e escolha **main**.

---

## 2. Pull Request #7

**Onde:** Repositório → **Pull requests**

**O que verificar:** O PR #7 ("docs: rename to Cardápio Digital") ainda está aberto?

**Ação:** Se o merge já foi feito (como fizemos localmente), você pode **fechar o PR** com um comentário tipo: "Merge realizado diretamente em main."

Ou, se o PR apontar para outra branch, avalie se ainda faz sentido mantê-lo aberto.

---

## 3. Variáveis de ambiente (Vercel)

**Onde:** [Vercel Dashboard](https://vercel.com) → Seu projeto → **Settings** → **Environment Variables**

**O que verificar:** As variáveis necessárias estão configuradas? Exemplos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (ex: https://zairyx.com)
- Chaves do Mercado Pago (se usar pagamento)

**Por quê:** Sem isso, o site pode quebrar em produção (login, banco, pagamentos).

---

## 4. Branch de deploy na Vercel

**Onde:** Vercel → Projeto → **Settings** → **Git** → **Production Branch**

**O que verificar:** Está configurado para **main**?

**Por quê:** O deploy de produção deve vir da branch correta. Se estiver em outra, as alterações podem não ir para o ar.

---

## 5. Descrição do repositório

**Onde:** Repositório → **About** (lado direito) → ícone de lápis

**O que verificar:** A descrição está clara? Exemplo:

> Cardápio digital para restaurantes. Painel simples, 0% comissão, pedidos no WhatsApp.

**Por quê:** Ajuda quem encontrar o repositório a entender do que se trata.

---

## 6. Tópicos (Topics)

**Onde:** Repositório → **About** → **Topics**

**O que verificar:** Tem tópicos como `cardapio-digital`, `restaurante`, `saas`, `nextjs`?

**Por quê:** Facilita a descoberta do projeto no GitHub.

---

## 7. Branches antigas

**Onde:** Repositório → **Branches**

**O que verificar:** Existem muitas branches (feature/..., cursor/...) que já não são usadas?

**Ação:** Branches antigas podem ser deletadas para não confundir. Cuidado: só apague se tiver certeza de que não precisa mais delas.

---

## 8. Segurança — arquivos sensíveis

**O que verificar:** Nunca commitar:

- `.env` ou `.env.local` (senhas, chaves de API)
- Chaves do Mercado Pago
- Tokens de acesso

**Status:** O `.gitignore` já ignora `.env*`. Mantenha assim.

---

## 9. Colaboradores

**Onde:** Repositório → **Settings** → **Collaborators**

**O que verificar:** Quem tem acesso ao repositório? As permissões estão corretas?

---

## 10. Proteção da branch main (opcional)

**Onde:** Repositório → **Settings** → **Branches** → **Add branch protection rule**

**O que fazer:** Pode criar regra para **main** exigir PR aprovado antes de merge. Assim ninguém commita direto em main por engano.

**Para não-programadores:** Isso é opcional. Só vale a pena se mais pessoas forem mexer no código.

---

## Resumo rápido

| Item                    | Prioridade | Onde                    |
| ----------------------- | ---------- | ----------------------- |
| Branch padrão = main    | Alta       | Settings → General      |
| PR #7 fechado           | Média      | Pull requests           |
| Variáveis Vercel        | Alta       | Vercel Dashboard        |
| Branch de deploy = main | Alta       | Vercel → Settings → Git |
| Descrição e tópicos     | Baixa      | About                   |
| Branches antigas        | Baixa      | Branches                |

---

## Se algo der errado

- **Site não atualiza:** Verifique branch de deploy na Vercel e se o último push foi em main.
- **Login não funciona:** Verifique variáveis do Supabase na Vercel.
- **Pagamento não funciona:** Verifique chaves do Mercado Pago na Vercel.
