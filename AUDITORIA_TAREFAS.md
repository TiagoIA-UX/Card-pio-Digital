<!-- markdownlint-disable -->

# Script de Tarefas - Auditoria da Plataforma

## Como usar

- Marque `[x]` quando concluir cada etapa.
- Execute os comandos na ordem para validar estabilidade.

## Fase 1 — Qualidade técnica

- [x] Rodar build de produção
- [x] Rodar lint
- [x] Corrigir erros (não warnings)
- [x] Rodar build novamente

Comandos:

```bash
npm run build
npm run lint
npm run build
```

## Fase 2 — Fluxo comercial (conversão)

- [x] Validar rota de compra por template: `/comprar/[template]`
- [x] Validar login com redirect para `/comprar/[template]` (fluxo atual, `/finalizar-compra` é legado)
- [x] Validar criação da preferência Mercado Pago
- [x] Validar retorno em `/pagamento/sucesso`
- [x] Validar oferta pós-checkout no sucesso

Checklist rápido:

- [x] Template correto chega no checkout
- [x] Plano correto chega no pagamento
- [x] Status de pagamento atualiza para ativo
- [x] Painel libera após aprovação

### Correções aplicadas (Fase 2):

- **Webhook segurança:** `MP_WEBHOOK_SECRET` agora é obrigatório (antes aceitava sem validação)
- **Polling resiliência:** `/pagamento/sucesso` agora faz retry em erros de rede (antes abortava)

## Fase 3 — UX neurocomportamental

- [x] CTA único por etapa
- [ ] Prova social próxima ao botão principal
- [x] Fricção mínima no checkout
- [x] Oferta final com ancoragem de preço
- [x] Mensagem de urgência ética (janela real)

### Correções aplicadas (Fase 3):

- **Hero:** CTA "Ver planos" rebaixado para link de texto (antes competia com primário)
- **Checkout:** Campo de cupom agora colapsável (antes ficava aberto = abandonos)
- **Oferta pós-compra:** Adicionada janela real "Disponível nos primeiros 7 dias"
- **Métricas:** templates/page.tsx atualizado (removido "500+ Clientes" e "4.8 Avaliação")

## Fase 4 — Operação e monitoramento

- [x] Revisar logs de webhook Mercado Pago
- [x] Validar reprocessamento de pagamento pendente
- [x] Revisar erros de autenticação
- [ ] Testar fluxo completo em mobile

## Fase 5 — Deploy seguro

- [ ] Commit com escopo claro
- [ ] Push para branch atual
- [ ] Validar preview/deploy
- [ ] Smoke test em produção

Comandos:

```bash
git add -A
git commit -m "chore: auditoria e melhorias de fluxo"
git push origin rename/cardapio-digital
```

## Definição de pronto

- [ ] `npm run build` sem erros
- [ ] `npm run lint` sem erros
- [ ] Fluxo comercial testado ponta a ponta
- [ ] Oferta pós-checkout funcional
- [ ] Sem regressão no painel administrativo
