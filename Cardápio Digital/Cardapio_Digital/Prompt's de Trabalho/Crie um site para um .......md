Crie um site para um restaurante local (lanchonete, marmitaria ou pizzaria) em Caraguatatuba chamado [NOME DO ESTABELECIMENTO].

Objetivo do site:
Funcionar como um Cardápio Digital com categorias, onde o cliente escolhe os itens e envia o pedido pelo WhatsApp.
Este site NÃO é um app complexo, NÃO possui pagamento online e NÃO possui backend.

Público-alvo:
Clientes locais usando celular para pedir comida rapidamente.

Design:
- Mobile-first extremo
- Carregamento muito rápido (4G)
- Tailwind CSS
- Visual limpo, moderno e funcional
- Botões grandes e fáceis de clicar
- Foco absoluto em usabilidade

Estrutura do site (preferencialmente ONE-PAGE, com rolagem):

1. Hero Section
   - Nome do restaurante
   - Frase curta: "Peça direto pelo WhatsApp"
   - Botão principal: "Fazer pedido agora"

2. Cardápio Digital (seção principal)
   O cardápio deve ser dividido por CATEGORIAS, com navegação simples:
   - Lanches
   - Marmitas
   - Pizzas
   - Bebidas
   - Adicionais (se aplicável)

   Para cada item do cardápio:
   - Nome do produto
   - Descrição curta
   - Preço
   - Botão: "Adicionar ao pedido"

3. Montagem do Pedido (frontend simples)
   - Ao clicar em "Adicionar ao pedido", o item deve ser incluído em um resumo visual do pedido (lista simples).
   - Exibir os itens selecionados e o total estimado.
   - Botão final: "Enviar pedido pelo WhatsApp".

4. Envio para WhatsApp
   - Ao clicar em "Enviar pedido pelo WhatsApp", gerar automaticamente uma mensagem com:
     - Lista dos itens escolhidos
     - Quantidades
     - Valor total estimado
   - Abrir o WhatsApp com a mensagem pronta para envio.
   - Usar link padrão wa.me com texto pré-formatado.

5. Informações do Restaurante
   - Horário de funcionamento
   - Endereço (texto simples)
   - Observação: "Pedidos confirmados pelo WhatsApp"

6. Rodapé
   - Nome do restaurante
   - Cidade: Caraguatatuba – SP
   - Botão de WhatsApp flutuante fixo

Requisitos técnicos:
- Tudo em HTML/CSS/JS simples (frontend apenas)
- Sem banco de dados
- Sem login
- Sem pagamento online
- Código limpo e fácil de ajustar
- Foco absoluto em velocidade, simplicidade e conversão
