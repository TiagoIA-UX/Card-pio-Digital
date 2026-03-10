# Cardápio Digital Notes

## Sessão de 2026-03-09 a 2026-03-10

### O que foi feito

- Resolvidos e commitados os diffs locais pendentes de URL dinâmica por requisição no fluxo de pagamento, onboarding e webhook do Mercado Pago.
- Evoluído o editor do painel em [app/painel/configuracoes/page.tsx] com mapeamento contextual entre elementos do preview e grupos da sidebar.
- Adicionado uso explícito de data-block no preview em [components/template-editor/cardapio-editor-preview.tsx] para mapear banner, header, cores, hero, atendimento, produtos e bloco institucional.
- Implementado highlight visual no elemento selecionado do preview e scroll automático para o grupo correspondente na sidebar.
- Implementada edição inline básica de produto no preview para itens reais, com persistência na mesma tabela products já usada pelo projeto.
- Mantido o fallback existente de produtos de exemplo quando o restaurante ainda não possui itens reais, sem criar estrutura paralela.
- Refatorado o inline textual do preview para um mapa configurável central em [components/template-editor/cardapio-editor-preview.tsx], sem mudar banco, parser, renderer ou estrutura de persistência.
- Expandido o mapa configurável para badge, hero title, hero description, CTAs do hero, bloco institucional e campos da seção de produtos.

### Estado atual do projeto

- Branch ativa: rename/cardapio-digital.
- Fluxo operacional principal validado com npm run ship:all.
- Resultado da validação desta sessão: ambiente OK, lint sem erros bloqueantes, 11 testes passando e onboarding OK.
- Commits mais recentes desta sessão:
  - 78bc24e chore: resolve pending local diffs before contextual editor
  - 217f0f8 feat: contextual editor with click-to-edit preview and inline product editing
  - fa9416e refactor: centralize inline text fields into configurable map
  - 1f17aba feat: extend configurable inline map to product section fields

### Decisões conservadoras aplicadas

- Não foi criada nova arquitetura para o editor; a evolução reaproveita o renderer existente e a persistência atual.
- A edição inline só persiste produtos reais; produtos de exemplo do template continuam apenas como fallback visual.
- O mapeamento contextual foi feito por data-block, e o foco fino continua usando data-editor-field já existente.
- O inline textual agora usa um mapa configurável central e helper único de update; a repetição restante segue concentrada em [components/template-editor/cardapio-editor-preview.tsx].

### Critério acordado para extração futura

- Extrair o inline para pasta ou arquivo dedicado apenas quando o mesmo padrão aparecer em mais de um arquivo.
- Extrair o inline para pasta ou arquivo dedicado apenas quando o mesmo padrão aparecer em mais de um tipo de bloco.
- Extrair o inline para pasta ou arquivo dedicado apenas quando o comportamento precisar ser compartilhado entre preview, painel e futuros templates.
- Enquanto a repetição continuar concentrada em um único arquivo, manter local é a decisão mais conservadora.

### Próximo passo lógico

- Medir a repetição residual depois da expansão dos campos de produto e só então decidir se a extração para componente dedicado passa a valer.

