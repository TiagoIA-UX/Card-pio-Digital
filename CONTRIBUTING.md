# Contribuindo para o Cardápio Digital

Obrigado por considerar contribuir! Este guia explica como participar do projeto.

## Primeiros Passos

1. Fork o repositório
2. Clone seu fork: `git clone https://github.com/SEU_USUARIO/Cardapio-Digital.git`
3. Instale dependências: `npm install`
4. Configure o ambiente: `npm run setup:local`
5. Valide: `npm run doctor`

## Fluxo de Trabalho

1. Crie uma branch a partir de `main`: `git checkout -b feature/minha-feature`
2. Faça suas alterações
3. Rode `npm run audit:full` (build + lint + testes)
4. Commit com mensagem descritiva
5. Abra um Pull Request para `main`

## Padrões de Código

- **TypeScript** strict — sem `any` desnecessário; use `catch (err) { err instanceof Error ? ... }` em blocos catch
- **ESLint** — `npm run lint` deve passar sem erros
- **Tailwind CSS** — sem CSS custom quando Tailwind resolve
- **Componentes** — Radix UI + shadcn/ui como base
- **Validação** — Zod para inputs de API
- **Supabase** — usar apenas `@/lib/supabase/client`, `server` ou `admin`; nunca criar cliente direto
- **Imagens** — sempre `next/image`, nunca `<img>`
- **Queries** — sempre filtrar por `user_id` ou `restaurant_id`; usar `.maybeSingle()` quando 0 rows é possível

## Estrutura de Commits

Use mensagens claras e descritivas:

```
feat: adiciona template para food truck
fix: corrige cálculo de comissão no tier Gold
docs: atualiza guia de instalação
```

## Segurança

- Nunca commite `.env` ou credenciais
- Sempre use RLS em novas tabelas Supabase
- Valide todos os inputs de API com Zod
- Nunca use `Math.random()` para tokens ou IDs sensíveis — use `crypto.randomUUID()`
- Veja [SECURITY.md](SECURITY.md) para reportar vulnerabilidades

## Auditoria de Código

Antes de abrir um PR, aplique o protocolo de auditoria cirúrgica documentado em [`docs/PROMPT_PHD_AUDITOR.md`](docs/PROMPT_PHD_AUDITOR.md). Os pontos essenciais:

1. **Leia o arquivo inteiro** antes de modificar qualquer linha
2. **Verifique o impacto** — mudanças podem quebrar outros arquivos que importam o mesmo módulo
3. **Checklist obrigatório**: `npm run audit:full` (build + lint + test) deve passar
4. **Anti-patterns proibidos** (ver lista completa em `docs/PROMPT_PHD_AUDITOR.md`):
   - `.single()` onde `.maybeSingle()` seria correto
   - `catch (err: any)` em vez de `catch (err) { err instanceof Error ? ... }`
   - Criar cliente Supabase fora de `@/lib/supabase/`
   - `<img>` em vez de `next/image`
   - Queries sem filtro por `user_id` ou `restaurant_id`

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a [BSL 1.1](LICENSE) do projeto.

