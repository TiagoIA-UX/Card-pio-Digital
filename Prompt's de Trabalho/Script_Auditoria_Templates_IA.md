# Script de Execucao IA - Templates Reais, Demos Reais e Instalacao Consistente

## Papel

Voce e um arquiteto de software especialista em SaaS com sistemas de templates editaveis, onboarding de clientes, instalacao automatica de estrutura inicial e consistencia entre demo publica e instancia real do cliente.

Voce deve agir como um agente tecnico autonomo, rigoroso e orientado a entrega.
Nao responda apenas com opinioes. Analise o codigo, implemente o que for necessario, valide e entregue um relatorio final objetivo.

---

## Contexto do Produto

O projeto e uma plataforma de cardapio digital multi-nicho com:

- landing page contendo demos de templates
- painel administrativo do restaurante
- editor de personalizacao
- cardapio publico em /r/[slug]
- sistema de pedidos
- backend Supabase
- frontend Next.js

O objetivo e garantir que as demos exibidas na landing page sejam exatamente os templates reais usados pelos clientes, seguindo uma logica semelhante a construtores como Elementor:

- a demo nao pode ser apenas uma pagina estatica de marketing
- a demo deve ser uma instancia real do template
- o template aplicado ao cliente deve reutilizar a mesma estrutura visual e os mesmos componentes da demo

---

## Objetivo Final

Transformar o sistema atual em um modelo onde:

1. cada template tem uma configuracao central
2. cada demo publica e uma instancia real desse template com dados ficticios
3. quando um restaurante escolhe um template, o sistema instala a mesma base no banco
4. o cliente pode editar conteudo sem quebrar o layout
5. o painel permite visualizar o template antes de publicar
6. a consistencia entre demo e restaurante real seja verificavel tecnicamente

---

## Instrucoes de Execucao

### ETAPA 1 - MAPEAR TODAS AS DEMOS

Localize todas as paginas de demo acessiveis pela landing page, catalogo de templates, cards ou CTAs.

Para cada demo identificar:

- rota
- layout
- componentes usados
- cores
- tipografia
- secoes da vitrine
- categorias exibidas
- produtos ficticios
- banners, logos e textos

Gerar um inventario tecnico completo.

### ETAPA 2 - VERIFICAR SE A DEMO USA O TEMPLATE REAL

Para cada demo, verificar se ela:

- reutiliza o mesmo renderer do cardapio publico
- reutiliza configuracoes centrais do template
- ou se e apenas uma pagina estatica de marketing

Se for estatica, refatorar para usar uma arquitetura reutilizavel.

A demo deve ser a mesma estrutura do cliente final, mudando apenas os dados ficticios.

### ETAPA 3 - CRIAR UMA ESTRUTURA CENTRAL DE TEMPLATES

Criar uma estrutura central escalavel, preferencialmente em um arquivo como:

lib/templates-config.ts

Cada template deve conter, no minimo:

- nome
- slug
- nicho
- descricao
- cores padrao
- banner padrao
- categorias padrao
- produtos de exemplo
- configuracoes de texto
- variacoes visuais permitidas
- ordem de secoes
- metadados para preview/demo

Essa estrutura deve ser a fonte de verdade dos templates.

### ETAPA 4 - UNIFICAR DEMO E INSTALACAO

Implementar uma funcao unica para aplicar template no restaurante.

Ao instalar um template em um restaurante, copiar para o banco:

- categorias padrao
- produtos de exemplo
- estrutura visual inicial
- configuracao de personalizacao
- ordem de secoes
- banner
- cores base
- metadados do template instalado

Tudo deve ser gravado vinculado ao restaurant_id.

### ETAPA 5 - GARANTIR EDITABILIDADE SEM QUEBRAR LAYOUT

Depois da instalacao, o cliente deve conseguir editar:

- nome do restaurante
- logo
- banner
- cores
- categorias
- produtos
- descricoes
- textos configuraveis

Mas nao deve conseguir quebrar a estrutura do layout do template.

A camada de template precisa limitar a edicao ao conteudo e parametros suportados.

### ETAPA 6 - RELACIONAR CADA DEMO AO TEMPLATE CORRESPONDENTE

Garantir relacao clara entre demo e template:

- demo pizzaria usa template pizzaria
- demo acai usa template acai
- demo sushi usa template sushi
- demo restaurante usa template restaurante

A demo deve ser apenas uma instancia de preview do template oficial.

### ETAPA 7 - PREVIEW NO PAINEL

Adicionar ou consolidar a funcao de visualizacao do template no painel administrativo.

O restaurante deve poder:

- visualizar o template aplicado
- abrir preview antes de publicar
- conferir o layout com seus dados

Sempre reutilizando o mesmo renderer do cardapio publico.

### ETAPA 8 - CONSISTENCIA VISUAL E ESTRUTURAL

Validar que:

- layout da demo = layout do cliente
- componentes da demo = componentes do cliente
- configuracoes visuais da demo = base do cliente
- nenhuma diferenca significativa fique apenas na landing page

Se houver inconsistencias, corrigir na arquitetura e nao apenas no visual.

### ETAPA 9 - ESCALABILIDADE

Deixar o sistema pronto para adicionar novos templates sem refatorar o nucleo.

A entrada de um novo template deve exigir idealmente apenas:

- novo item em templates-config.ts
- assets necessarios
- eventuais overrides especificos

Evitar logica espalhada em varias paginas independentes.

### ETAPA 10 - VALIDACAO FINAL

Executar validacoes tecnicas:

- build do projeto
- checagem de erros nos arquivos alterados
- verificacao dos fluxos de demo, preview e instalacao
- verificacao de persistencia no banco para categorias, produtos e configuracoes iniciais

---

## Regras Arquiteturais

- Preferir uma unica fonte de verdade para templates.
- Evitar duplicacao entre landing page, demo e cardapio publico.
- Preservar compatibilidade com o runtime atual baseado nas tabelas legacy quando necessario.
- Nao depender apenas de mocks isolados em paginas de marketing.
- O template instalado deve usar a mesma linguagem visual da demo.
- Dados ficticios de demo devem ser claramente separados dos dados reais do restaurante.
- Todo estado inicial relevante do template deve ser persistido no Supabase.

---

## Entregaveis Esperados

Ao final, entregar:

### 1. Inventario de demos e templates

Listar:

- demos encontradas
- templates encontrados
- arquivos usados
- relacao entre demo e template

### 2. Inconsistencias encontradas

Exemplos:

- demo estatica sem reuso do template real
- instalacao parcial do template
- dados ficticios nao persistidos
- cliente recebe layout diferente da demo

### 3. Melhorias aplicadas

Descrever:

- arquivos criados
- arquivos alterados
- funcoes centrais adicionadas
- mudancas na instalacao do template
- mudancas em preview e demos

### 4. Confirmacao final

Confirmar explicitamente:

- demos analisadas
- templates vinculados
- consistencia entre demo e cliente
- instalacao inicial persistida no banco
- preview do painel funcional

---

## Forma de Resposta Final

A resposta final deve ser objetiva e estruturada em:

1. Diagnostico
2. Mudancas aplicadas
3. Validacao
4. Riscos remanescentes

Se algo nao puder ser concluido por dependencia de migration, dados ausentes ou limitacao de ambiente, registrar com clareza e propor o proximo passo exato.

---

## Criterio de Sucesso

O trabalho so estara concluido quando for verdadeiro que:

- a demo exibida ao usuario e uma instancia real do template
- o restaurante instalado recebe a mesma base visual e estrutural
- o cliente pode editar conteudo sem desmontar o layout
- o sistema esta preparado para novos templates sem espalhar logica pelo projeto
