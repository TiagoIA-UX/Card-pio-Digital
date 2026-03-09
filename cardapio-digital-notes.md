# Cardápio Digital Notes

## Sessão de 2026-03-09

### O que foi feito

- Resolvidos e commitados os diffs locais pendentes de URL dinâmica por requisição no fluxo de pagamento, onboarding e webhook do Mercado Pago.
- Evoluído o editor do painel em [app/painel/configuracoes/page.tsx] com mapeamento contextual entre elementos do preview e grupos da sidebar.
- Adicionado uso explícito de data-block no preview em [components/template-editor/cardapio-editor-preview.tsx] para mapear banner, header, cores, hero, atendimento, produtos e bloco institucional.
- Implementado highlight visual no elemento selecionado do preview e scroll automático para o grupo correspondente na sidebar.
- Implementada edição inline básica de produto no preview para itens reais, com persistência na mesma tabela products já usada pelo projeto.
- Mantido o fallback existente de produtos de exemplo quando o restaurante ainda não possui itens reais, sem criar estrutura paralela.

### Estado atual do projeto

- Branch ativa: rename/cardapio-digital.
- Fluxo operacional principal validado com npm run ship:all.
- Resultado da validação desta sessão:
  - ambiente OK
  - lint sem erros bloqueantes
  - 11 testes passando
  - onboarding OK
- Commits mais recentes desta sessão:
  - 78bc24e chore: resolve pending local diffs before contextual editor
  - 217f0f8 feat: contextual editor with click-to-edit preview and inline product editing

### Decisões conservadoras aplicadas

- Não foi criada nova arquitetura para o editor; a evolução reaproveita o renderer existente e a persistência atual.
- A edição inline só persiste produtos reais; produtos de exemplo do template continuam apenas como fallback visual.
- O mapeamento contextual foi feito por data-block, e o foco fino continua usando data-editor-field já existente.

### Próximo passo lógico

- Expandir o editor contextual para edição inline de mais elementos do template além dos produtos, começando por badge, hero title e textos institucionais com experiência similar à dos cards de produto.
