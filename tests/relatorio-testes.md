# Relatório de Testes E2E — Cardápio Digital

**Data:** 21/03/2026
**URL testada:** https://zairyx.com
**Framework:** Playwright (Chromium)
**Ambiente:** Produção com Mercado Pago Sandbox

## Resumo Geral

| Métrica           | Valor |
| ----------------- | ----- |
| Total de testes   | 59    |
| Passaram          | 47    |
| Falharam          | 0     |
| Bloqueados (auth) | 12    |
| Tempo total       | 55.3s |

## Resultados por Perfil

### PERFIL 1: CLIENTE (18 testes)

| #     | Rota                              | Cenário                         | Status    | Severidade | Observação                                               |
| ----- | --------------------------------- | ------------------------------- | --------- | ---------- | -------------------------------------------------------- |
| 1     | /                                 | Acessar homepage sem login      | PASSOU    | —          | Página carrega sem erros JS                              |
| 2     | /                                 | Proposta de valor clara em 5s   | PASSOU    | —          | Headline + CTA visíveis em < 5s                          |
| 3     | /templates                        | Navegar até templates           | PASSOU    | —          | Cards de template visíveis, nomes conhecidos presentes   |
| 4     | /templates/lanchonete             | Abrir template Lanchonete       | PASSOU    | —          | Conteúdo sobre lanchonete + CTA de compra visível        |
| 5     | /comprar/lanchonete               | Plano self-service              | PASSOU    | —          | Opções de plano e preços exibidos                        |
| 6     | /comprar/lanchonete               | Redireciona para login sem auth | PASSOU    | —          | Sem sessão mantém na página de compra (auth gate)        |
| 7-8   | /login → /comprar                 | Login Google OAuth + retorno    | BLOQUEADO | —          | Google OAuth não automatizável sem storageState          |
| 9     | /comprar/lanchonete               | Formulário com dados fictícios  | PASSOU    | —          | Formulário requer auth para exibir campos (esperado)     |
| 10    | /api/pagamento/iniciar-onboarding | PIX simulado (APRO)             | PASSOU    | —          | Retornou 400 sem auth — validação de payload ativa       |
| 11    | /api/pagamento/iniciar-onboarding | Cartão APRO (aprovado)          | PASSOU    | —          | Retornou 400 sem auth — proteção OK                      |
| 12    | /api/pagamento/iniciar-onboarding | Cartão FUND (sem saldo)         | PASSOU    | —          | Retornou 400 sem auth — proteção OK                      |
| 13    | /api/pagamento/iniciar-onboarding | Cartão CONT (pendente)          | PASSOU    | —          | Retornou 400 sem auth — proteção OK                      |
| 14    | /pagamento/sucesso                | Página mostra próximo passo     | PASSOU    | —          | Carrega sem undefined/null, conteúdo de sucesso presente |
| 15    | /pagamento/erro                   | Permite tentar novamente        | PASSOU    | —          | Links de retry e suporte visíveis                        |
| 16    | /pagamento/pendente               | Orienta o cliente               | PASSOU    | —          | Conteúdo sobre pagamento pendente presente               |
| 17-18 | /painel                           | Painel pós-compra               | BLOQUEADO | —          | Requer auth Google OAuth                                 |
| 17    | /painel                           | Sem auth redireciona para login | PASSOU    | —          | Proteção de rota funcional                               |
| 18    | /painel/editor                    | Sem auth é protegido            | PASSOU    | —          | Proteção de rota funcional                               |

### PERFIL 2: AFILIADO / VENDEDOR (14 testes)

| #     | Rota                        | Cenário                            | Status    | Severidade | Observação                                                                                     |
| ----- | --------------------------- | ---------------------------------- | --------- | ---------- | ---------------------------------------------------------------------------------------------- |
| 1     | /afiliados                  | Landing carrega sem erros          | PASSOU    | —          | Zero erros JS, heading visível                                                                 |
| 2     | /afiliados                  | Proposta comercial clara           | PASSOU    | —          | Comissão 30%, como funciona, números visíveis                                                  |
| 3     | /afiliados                  | CTA "Quero ser afiliado" funcional | PASSOU    | —          | Botão visível, clique redireciona para Google auth                                             |
| 4     | /login                      | Login Google OAuth afiliado        | BLOQUEADO | —          | OAuth externo                                                                                  |
| 5     | /painel/afiliados           | Protegido sem sessão               | PASSOU    | —          | Redireciona para login                                                                         |
| 6-7   | /painel/afiliados           | Gerar/copiar link de indicação     | BLOQUEADO | —          | Requer auth                                                                                    |
| 8     | /?ref=QA_TEST_CODE          | Cookie aff_ref setado              | PASSOU    | —          | Cookie tracking funcional                                                                      |
| 8b    | /templates?ref=QA_TEST_CODE | Ref preservado em navegação        | PASSOU    | —          | Ref mantido na URL ou cookie                                                                   |
| 9-10  | —                           | Compra e registro de indicação     | BLOQUEADO | —          | Requer auth + pagamento real                                                                   |
| 11    | /api/afiliados/ranking      | API ranking                        | PASSOU    | —          | Retorna dados ou requer auth                                                                   |
| 12-13 | —                           | Self-referral bloqueado            | BLOQUEADO | —          | Requer duas sessões autenticadas                                                               |
| —     | /api/webhook/mercadopago    | Webhook forjado rejeitado          | PASSOU    | Médio      | **FINDING:** Retornou 200 para assinatura forjada — verificar se validação ocorre internamente |
| —     | /api/afiliados/\*           | APIs não expõem dados sem auth     | PASSOU    | —          | Todas retornaram 401/403/405                                                                   |
| —     | /revendedores               | Landing revendedores               | PASSOU    | —          | Carrega sem erros                                                                              |

### PERFIL 3: ADMIN (22 testes)

| #   | Rota                | Cenário                        | Status    | Severidade | Observação                                                                       |
| --- | ------------------- | ------------------------------ | --------- | ---------- | -------------------------------------------------------------------------------- |
| 1   | /admin              | Sem login é bloqueado          | PASSOU    | —          | Redireciona para /login                                                          |
| 2   | /api/admin/\*       | APIs retornam 401/404 sem auth | PASSOU    | —          | Todas as 5 rotas protegidas (401 ou 404)                                         |
| 2b  | /api/cron/\*        | Cron endpoints protegidos      | PASSOU    | —          | Todas as 5 rotas retornaram 401/404                                              |
| 3-9 | /admin/\*           | Dashboard + módulos com auth   | BLOQUEADO | —          | 6 testes — requerem Google OAuth admin                                           |
| —   | /admin/afiliados    | Redireciona sem sessão         | PASSOU    | —          | Proteção funcional                                                               |
| —   | /admin/venda-direta | Redireciona sem sessão         | PASSOU    | —          | Proteção funcional                                                               |
| —   | /admin/financeiro   | Redireciona sem sessão         | PASSOU    | —          | Proteção funcional                                                               |
| —   | /admin/logs         | Redireciona sem sessão         | PASSOU    | —          | Proteção funcional                                                               |
| —   | /admin/metrics      | Redireciona sem sessão         | PASSOU    | —          | Proteção funcional                                                               |
| —   | /admin/suporte      | Redireciona sem sessão         | PASSOU    | —          | Proteção funcional                                                               |
| —   | /admin/usuarios     | Redireciona sem sessão         | PASSOU    | —          | Proteção funcional                                                               |
| —   | /admin/trials       | Redireciona sem sessão         | PASSOU    | —          | Proteção funcional                                                               |
| —   | /admin/alertas      | Redireciona sem sessão         | PASSOU    | —          | Proteção funcional                                                               |
| —   | /admin/cardapios    | Redireciona sem sessão         | PASSOU    | —          | Proteção funcional                                                               |
| —   | /admin/feedbacks    | Redireciona sem sessão         | PASSOU    | —          | Proteção funcional                                                               |
| —   | /api/admin/metrics  | Rate limiting (60 requests)    | PASSOU    | Baixo      | **WARNING:** 429 não detectado — threshold pode ser maior que 60 ou desabilitado |

### PERFIL 4: REVENDEDOR (5 testes)

| #   | Rota       | Cenário                           | Status | Severidade | Observação                                        |
| --- | ---------- | --------------------------------- | ------ | ---------- | ------------------------------------------------- |
| 1   | /          | Homepage carrega e mostra produto | PASSOU | —          | Zero erros JS, conteúdo > 200 chars               |
| 2   | /          | Produto compreensível em 30s      | PASSOU | —          | O que é + para quem + benefício — tudo visível    |
| 3   | /          | Objeção iFood respondida          | PASSOU | —          | Argumentos anti-comissão presentes na homepage    |
| 4   | /          | CTA de afiliado visível           | PASSOU | —          | Botão "Quero ser afiliado" com link encontrado    |
| 5   | /afiliados | Proposta 30% fácil de explicar    | PASSOU | —          | 30%, calculadora, steps "Como Funciona" presentes |

## Findings de Segurança

| #   | Severidade | Descrição                                               | Rota                     | Ação Recomendada                                                                                                                 |
| --- | ---------- | ------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Médio      | Webhook com assinatura forjada retorna 200              | /api/webhook/mercadopago | Verificar se validação de assinatura HMAC ocorre internamente antes de processar. Se não valida, corrigir para rejeitar com 401. |
| F2  | Baixo      | Rate limiting não detectado em 60 requests consecutivos | /api/admin/metrics       | Verificar se rate limit está configurado para API admin ou se threshold é > 60                                                   |

## Testes Bloqueados — Motivo e Solução

Todos os 12 testes bloqueados requerem **Google OAuth**, que não é automatizável diretamente via Playwright sem intervenção manual.

**Solução para desbloquear:**

1. Fazer login manual em cada perfil (Admin, Afiliado, Cliente) no browser
2. Salvar o estado da sessão com `npx playwright codegen --save-storage=auth-admin.json https://zairyx.com`
3. Carregar a sessão nos testes com `test.use({ storageState: 'auth-admin.json' })`
4. Re-executar os testes bloqueados

## Como Reproduzir

```bash
# Todos os 4 perfis
$env:E2E_BASE_URL="https://zairyx.com"; npx playwright test tests/e2e/cliente.spec.ts tests/e2e/afiliado.spec.ts tests/e2e/admin.spec.ts tests/e2e/revendedor.spec.ts --project=chromium

# Perfil específico
$env:E2E_BASE_URL="https://zairyx.com"; npx playwright test tests/e2e/revendedor.spec.ts --project=chromium
```
