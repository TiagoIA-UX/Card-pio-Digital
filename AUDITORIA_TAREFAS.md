<!-- markdownlint-disable -->

# Script de Tarefas - Auditoria da Plataforma

## Como usar
- Marque `[x]` quando concluir cada etapa.
- Execute os comandos na ordem para validar estabilidade.

## Fase 1 — Qualidade técnica
- [ ] Rodar build de produção
- [ ] Rodar lint
- [ ] Corrigir erros (não warnings)
- [ ] Rodar build novamente

Comandos:
```bash
npm run build
npm run lint
npm run build
```

## Fase 2 — Fluxo comercial (conversão)
- [ ] Validar rota de compra por template: `/comprar/[template]`
- [ ] Validar login com redirect para `/finalizar-compra`
- [ ] Validar criação da preferência Mercado Pago
- [ ] Validar retorno em `/pagamento/sucesso`
- [ ] Validar oferta pós-checkout no sucesso

Checklist rápido:
- [ ] Template correto chega no checkout
- [ ] Plano correto chega no pagamento
- [ ] Status de pagamento atualiza para ativo
- [ ] Painel libera após aprovação

## Fase 3 — UX neurocomportamental
- [ ] CTA único por etapa
- [ ] Prova social próxima ao botão principal
- [ ] Fricção mínima no checkout
- [ ] Oferta final com ancoragem de preço
- [ ] Mensagem de urgência ética (janela real)

## Fase 4 — Operação e monitoramento
- [ ] Revisar logs de webhook Mercado Pago
- [ ] Validar reprocessamento de pagamento pendente
- [ ] Revisar erros de autenticação
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
