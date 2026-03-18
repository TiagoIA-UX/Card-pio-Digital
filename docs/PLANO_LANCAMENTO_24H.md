# PLANO DE EXECUÇÃO — GO-TO-MARKET EM 24 HORAS

## Contexto Estratégico

**Produto:** Cardápio Digital — plataforma SaaS brasileira que permite a restaurantes criar, editar e operar cardápio digital com pedidos via WhatsApp, sem comissão por pedido.

**Modelo de receita:** Assinatura mensal (R$ 59–149/mês) ou pagamento único por ativação (a partir de R$ 197).

**Estágio atual:** MVP funcional com build aprovado, fluxo de compra validado em código. Falta validação de mercado com cliente real.

**Premissa fundamental:** Um produto que ninguém usa é uma hipótese. Um produto com um cliente pagando é um negócio. Este plano existe para cruzar essa fronteira em 24 horas.

---

## Princípio Operacional

> **Velocidade de execução supera amplitude de funcionalidade.**
>
> Cada hora gasta em refinamento sem cliente é custo de oportunidade.
> O único feedback que importa agora é dinheiro entrando.

---

## FASE 1 — INFRAESTRUTURA DE PRODUÇÃO (Hora 0–2)

### Objetivo

Transformar o repositório em um produto acessível publicamente.

### Ações Sequenciais

1. **Deploy na Vercel**
   - Push do branch `rename/cardapio-digital` para `main`
   - Conectar repositório GitHub → Vercel
   - Configurar domínio (subdomínio Vercel é aceitável para validação inicial)

2. **Variáveis de Ambiente de Produção**
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` (Mercado Pago produção)
   - `GROQ_API_KEY`
   - `NEXT_PUBLIC_SITE_URL` (URL final do deploy)
   - URLs de callback OAuth no Supabase (Google Auth)
   - URL do webhook Mercado Pago apontando para `/api/webhooks/mercadopago`

3. **Validação Pós-Deploy**
   - Acessar a URL pública → landing page carrega
   - Acessar `/templates` → lista de templates renderiza
   - Acessar `/r/demo` ou slug existente → cardápio público funciona

### Critério de Saída

Um link `https://[dominio].vercel.app` acessível de qualquer navegador, sem erro 500 na landing page.

---

## FASE 2 — VALIDAÇÃO END-TO-END EM DISPOSITIVO REAL (Hora 2–4)

### Objetivo

Simular a jornada completa do cliente antes de oferecer o produto a qualquer pessoa.

### Protocolo de Teste (executar no celular, não no desktop)

| #   | Etapa        | Ação                                                      | Resultado Esperado                                     |
| --- | ------------ | --------------------------------------------------------- | ------------------------------------------------------ |
| 1   | Descoberta   | Abrir URL no Chrome mobile                                | Landing page responsiva, CTA visível sem scroll        |
| 2   | Navegação    | Clicar "Ver os 7 templates"                               | Página `/templates` carrega com cards                  |
| 3   | Seleção      | Clicar em um template                                     | Página `/comprar/[template]` abre                      |
| 4   | Autenticação | Clicar "Ir para pagamento" sem login                      | Redirect para `/login`, Google OAuth funciona          |
| 5   | Retorno      | Após login Google                                         | Volta para `/comprar/[template]` com dados preenchidos |
| 6   | Pagamento    | Preencher dados, ir para Mercado Pago                     | Tela de pagamento MP renderiza                         |
| 7   | Aprovação    | Completar pagamento (usar cartão de teste ou Pix sandbox) | Redirect para `/pagamento/sucesso`                     |
| 8   | Webhook      | Aguardar processamento                                    | Status atualiza, restaurante provisionado              |
| 9   | Painel       | Acessar `/painel`                                         | Dashboard do restaurante acessível                     |
| 10  | Edição       | Adicionar/editar um produto                               | Produto aparece no cardápio público                    |
| 11  | Pedido       | Acessar cardápio público, simular pedido                  | Mensagem chega no WhatsApp configurado                 |

### Se Algum Passo Falhar

**PARA.** Corrige antes de prosseguir. Nenhuma venda sobrevive a um fluxo quebrado. Documente o erro, corrija, e repita o teste do passo que falhou.

### Critério de Saída

Gravação de tela (ou screenshots) de cada etapa concluída. Fluxo completo: da landing page até pedido no WhatsApp.

---

## FASE 3 — CORREÇÕES CIRÚRGICAS (Hora 4–8)

### Objetivo

Eliminar apenas o que impede conversão ou gera desconfiança.

### Matriz de Priorização

| Corrige Agora                                                         | Não Toca Agora            |
| --------------------------------------------------------------------- | ------------------------- |
| Bug que impede completar compra                                       | Animações e transições    |
| Erro visual que transmite amadorismo (texto cortado, imagem quebrada) | Refatoração de código     |
| Texto que confunde ou promete o que não entrega                       | Features novas            |
| Botão que não funciona no mobile                                      | Otimização de performance |
| Problema de autenticação                                              | Testes automatizados      |

### Regra de Decisão

> Se o problema não impede alguém de **ver, entender e comprar** → ele não existe para esta fase.

### Critério de Saída

O mesmo teste da Fase 2 passa sem nenhum bloqueio.

---

## FASE 4 — PROSPECÇÃO ATIVA (Hora 8–16)

### Objetivo

Gerar no mínimo 10 conversas reais com donos de restaurantes. Converter pelo menos 1 em usuário ativo.

### Definição do ICP (Ideal Customer Profile)

**Quem é o cliente ideal para os primeiros 30 dias:**

| Atributo              | Perfil                                                        |
| --------------------- | ------------------------------------------------------------- |
| Tipo de negócio       | Hamburguerias, pizzarias, açaiterias, lanchonetes             |
| Tamanho               | 1–3 funcionários, operação de bairro                          |
| Presença digital      | Tem Instagram ativo com fotos de pratos                       |
| Dor principal         | Paga comissão alta no iFood OU não está em nenhuma plataforma |
| Capacidade de decisão | Dono opera o Instagram pessoalmente                           |
| Localização           | Iniciar pela sua cidade → cidades vizinhas                    |

**Por que este perfil:** Decisão rápida (não tem comitê), dor tangível (taxa do iFood), e valoriza atendimento pessoal.

### Canais de Prospecção (em ordem de eficiência)

**Canal 1 — Instagram Direct (maior taxa de resposta)**

1. Pesquisar hashtags locais: `#hamburgueria[cidade]`, `#delivery[cidade]`, `#pizzaria[cidade]`
2. Filtrar perfis com 500–5000 seguidores (tamanho ideal)
3. Verificar se o perfil posta ativamente (última postagem < 7 dias)
4. Enviar mensagem personalizada (ver modelo abaixo)

**Canal 2 — WhatsApp direto**

1. Buscar no Google: "hamburguerias em [cidade] whatsapp"
2. Buscar no Google Maps: restaurantes com número de WhatsApp visível
3. Enviar mensagem direta com proposta

**Canal 3 — Presencial (maior taxa de conversão)**

Se houver restaurantes acessíveis a pé / de carro:

1. Visitar no horário calmo (14h–16h, entre almoço e jantar)
2. Pedir o cardápio
3. Comentar: "Vocês têm cardápio digital?"
4. Introduzir a proposta naturalmente

### Modelo de Abordagem — Instagram Direct

```
Fala, [nome]! Tudo bem?

Passei pelo perfil de vocês e curti muito a operação.

Eu desenvolvi uma ferramenta que monta um cardápio digital
completo pro restaurante — o cliente acessa pelo celular,
escolhe os itens e o pedido cai direto no WhatsApp de vocês.

Sem cadastro no iFood, sem taxa por pedido.

Tô selecionando alguns restaurantes da região pra testar
na prática. Posso montar um modelo com o cardápio de vocês
pra ver como fica?

Sem compromisso nenhum — só quero mostrar funcionando.
```

**Princípios da Mensagem:**

- **Personalizada** — menciona algo específico do Instagram deles
- **Sem jargão técnico** — "cardápio digital", não "plataforma SaaS"
- **Oferta de valor antes de pedir algo** — "posso montar pra vocês"
- **Baixo risco percebido** — "sem compromisso", "só quero mostrar"
- **Gatilho de exclusividade** — "selecionando alguns restaurantes"

### Modelo de Abordagem — WhatsApp

```
Boa tarde! Tudo bem?

Me chamo [nome], desenvolvi uma ferramenta que cria
cardápio digital com pedidos direto pelo WhatsApp —
sem depender de iFood e sem pagar comissão.

Vi que vocês trabalham com delivery e pensei que poderia
fazer sentido.

Posso mostrar como funciona? Leva 2 minutos.
```

### Volume e Cadência

| Métrica                 | Meta Mínima | Meta Ideal |
| ----------------------- | ----------- | ---------- |
| Mensagens enviadas      | 10          | 30         |
| Respostas recebidas     | 3           | 10         |
| Demonstrações agendadas | 1           | 3          |
| Interesse confirmado    | 1           | 2          |

### Critério de Saída

Pelo menos 1 pessoa respondeu com interesse real ("quero ver", "me mostra", "quanto custa").

---

## FASE 5 — DEMONSTRAÇÃO E FECHAMENTO (Hora 16–24)

### Objetivo

Converter interesse em cliente ativo — pago ou em teste assistido.

### Protocolo de Demonstração

Quando alguém demonstrar interesse:

**Passo 1 — Montar o cardápio deles (30-60 min)**

- Pegar fotos e preços do Instagram deles
- Montar no sistema com template adequado ao tipo de negócio
- Configurar WhatsApp deles como destino de pedidos
- Gerar link público

**Passo 2 — Enviar o resultado (mensagem)**

```
Pronto! Montei um modelo com os itens que vi no perfil de vocês.

Dá uma olhada: [link do cardápio]

Qualquer cliente acessa, escolhe o que quer, e o pedido
chega direto no WhatsApp de vocês.

Se quiser, posso ajustar os preços e produtos certinho
com vocês agora.
```

**Passo 3 — Responder objeções com dados**

| Objeção                       | Resposta                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Já uso o iFood"              | "O iFood é ótimo pra atrair gente nova. Este aqui é pro cliente que já conhece vocês — ele pede direto, sem taxa. Os dois funcionam juntos."       |
| "Quanto custa?"               | "O plano começa em R$ 59/mês. Sem taxa por pedido. Se vocês vendem R$ 3.000/mês pelo iFood, a comissão deles é uns R$ 400-800. Aqui é R$ 59 fixo." |
| "Preciso pensar"              | "Claro. O cardápio que montei fica salvo. Se quiser, pode testar com alguns clientes essa semana e depois decide."                                 |
| "Não sei mexer em tecnologia" | "O painel é igual editar um contato no celular. Muda preço, adiciona item, tira foto — tudo pelo celular. E eu ajudo vocês no começo."             |
| "Já tentei e não deu certo"   | "Entendo. A maioria das ferramentas é complicada. Esta aqui o dono controla tudo sozinho, sem depender de ninguém."                                |

**Passo 4 — Fechamento**

```
Se fizer sentido pra vocês, consigo deixar tudo configurado
e rodando completo.

O plano é [R$ X]/mês — sem taxa por pedido, sem surpresa.

Posso ativar agora e vocês já começam a receber pedidos
direto no WhatsApp hoje.
```

### Estratégia de Preço para Primeiro Cliente

| Cenário                  | Abordagem                                               |
| ------------------------ | ------------------------------------------------------- |
| Cliente entusiasmado     | Oferecer plano mensal normal (R$ 59-79/mês)             |
| Cliente hesitante        | Oferecer 7 dias grátis + primeiro mês por R$ 39         |
| Cliente muito resistente | Oferecer 30 dias grátis em troca de depoimento em vídeo |

**Regra:** O primeiro cliente tem valor desproporcional. Ele valida hipótese, gera depoimento, gera aprendizado. Não otimize receita — otimize aprendizado.

### Critério de Saída

1 cliente com cardápio ativo e usando o sistema (pago ou em período de teste assistido).

---

## MÉTRICAS DE SUCESSO EM 24H

| Métrica                         | Mínimo Viável | Resultado Ideal |
| ------------------------------- | ------------- | --------------- |
| Sistema online e funcional      | ✅            | ✅              |
| Pagamento testado end-to-end    | ✅            | ✅              |
| Contatos realizados             | 5             | 30              |
| Respostas com interesse         | 1             | 5               |
| Demonstrações feitas            | 1             | 3               |
| Clientes ativos (pago ou teste) | 0\*           | 1+              |

\*Nota: Mesmo sem conversão em 24h, ter 5 conversas reais é sucesso — você aprende objeções, ajusta proposta e segue no dia seguinte.

---

## ARMADILHAS A EVITAR

### 1. Síndrome do "Só Mais Uma Feature"

> Se você está codando em vez de prospectando depois da Hora 8, está procrastinando com produtividade.

### 2. Mensagem Genérica em Massa

> 30 mensagens personalizadas geram mais resultado que 200 copiadas e coladas. Mencione o nome do restaurante, um prato específico, algo do Instagram deles.

### 3. Explicar Tecnologia

> O cliente não compra "plataforma SaaS com editor visual e integração via API REST". Ele compra "mais pedidos sem pagar taxa". Cada frase técnica que você fala é uma objeção que você cria.

### 4. Esperar o Momento Perfeito

> O sistema tem bugs? Tem. A landing page poderia ser melhor? Poderia. Mas nenhum desses problemas é resolvido sem feedback de quem pagaria para usar.

### 5. Desistir Após Rejeição

> Taxa de conversão em cold outreach: 1-5%. Se 10 pessoas não respondem, é estatística — não fracasso. Continue.

---

## APÓS AS 24 HORAS — PRÓXIMOS PASSOS

Dependendo do resultado:

**Se conseguiu 1 cliente ativo:**

- Documentar toda a jornada (como encontrou, o que disse, objeções, o que fechou)
- Replicar o processo 5x na semana seguinte
- Começar a coletar depoimento em vídeo com autorização
- Ativar programa de afiliados para escalar indicação

**Se conseguiu interesse mas não fechou:**

- Revisar objeções recebidas
- Ajustar proposta de valor
- Fazer follow-up em 24h com os interessados
- Testar abordagem presencial (taxa de conversão 3-5x maior)

**Se não conseguiu nenhuma resposta:**

- Revisar as mensagens enviadas (eram personalizadas?)
- Testar canal diferente (WhatsApp direto vs Instagram)
- Considerar abordagem presencial
- Ajustar ICP (talvez o tipo de restaurante não seja o ideal)

---

_Documento gerado em 18/03/2026 — Cardápio Digital v0.1.0_
_Fase atual: Pós-auditoria técnica, pré-validação de mercado_
