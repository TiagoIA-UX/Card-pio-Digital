# PROMPT PhD — Auditoria, melhorias visuais, deploy automático e sistema de alerta de capacidade

> **Uso:** Copiar e usar com IA ou time técnico. Exige auditoria antes de alterar qualquer coisa.

---

## CONTEXTO DO PROJETO

Você está trabalhando em um SaaS chamado **Cardápio Digital**, hospedado em Vercel e utilizando arquitetura moderna baseada em:

- Next.js
- React
- TypeScript
- Supabase
- Tailwind
- Integração com WhatsApp
- Templates de cardápio por nicho (pizzaria, hamburgueria, etc.)

O sistema já possui:

- painel administrativo
- editor de cardápio
- templates
- pedidos enviados para WhatsApp
- integração de pagamento
- landing page

O objetivo agora é **melhorar apresentação do produto, garantir deploy automático após edição de template e criar um sistema interno de alerta de capacidade de hospedagem.**

**IMPORTANTE:** Antes de alterar qualquer arquivo, **analise todo o repositório e preserve funcionalidades existentes**.

Não quebrar:

- fluxo de pedidos
- painel do restaurante
- editor de produtos
- integração WhatsApp
- integração Mercado Pago
- deploy atual

---

## ETAPA 1 — Auditoria completa do repositório

Analise o repositório inteiro.

Objetivos da auditoria:

1. entender arquitetura real do projeto
2. identificar onde está o editor de template
3. identificar como funciona o deploy atual
4. identificar onde armazenar dados de restaurante
5. verificar se já existe sistema de métricas

Gerar relatório com:

- arquitetura do projeto
- fluxo do editor de cardápio
- fluxo de deploy
- fluxo de cadastro de restaurante
- riscos de alteração

---

## ETAPA 2 — Capturas de telas profissionais (dashboard e editor)

Criar **imagens de apresentação do produto em alta qualidade (4K)** para usar na landing page.

### Dashboard do restaurante

- painel principal
- visão de pedidos
- visão de produtos
- categorias
- estatísticas

Objetivo: mostrar que **o dono controla tudo no painel**.

### Editor de produtos

- edição de produto
- alteração de preço
- troca de foto
- ativar ou pausar item
- salvar alterações

Mensagem: **qualquer dono de restaurante consegue usar.**

### Editor de cardápio

- categorias
- produtos
- interface simples
- edição rápida

### Qualidade das imagens

- resolução 4K
- alta nitidez
- sem compressão
- fundo limpo
- sem elementos de debug

---

## ETAPA 3 — Verificar deploy automático após edição do template

Investigar o fluxo completo do editor.

**Pergunta crítica:** Quando o dono termina de editar o template do cardápio, o sistema já publica automaticamente ou precisa de ação manual?

Se não existir deploy automático, implementar:

```
editar template → salvar alterações → publicar cardápio automaticamente → atualizar página pública
```

Objetivo: o restaurante editar e **ver a mudança imediatamente no cardápio online.**

---

## ETAPA 4 — Sistema interno de alerta de restaurantes cadastrados

Criar sistema interno que monitore quantidade de restaurantes cadastrados, contabilizando por tipo:

- pizzaria
- hamburgueria
- restaurante
- lanchonete
- outros

### Painel interno do administrador

- Total de restaurantes cadastrados
- Distribuição por nicho
- Crescimento de cadastros

---

## ETAPA 5 — Monitoramento de capacidade de hospedagem

O SaaS possui **hospedagem gratuita limitada.** Evitar atingir o limite sem aviso.

Monitorar:

- número total de restaurantes
- uso de storage
- uso de banda
- limite de hospedagem

### Sistema de alerta

Alerta automático quando atingir:

- 70% da capacidade
- 85% da capacidade
- 95% da capacidade

Exemplo:

```
ALERTA DE CAPACIDADE
85% da capacidade de hospedagem atingida.
Considere expandir infraestrutura ou criar novo plano de hospedagem.
```

---

## ETAPA 6 — Sistema de notificações internas

O administrador deve receber aviso quando:

- muitos restaurantes se cadastrarem
- capacidade estiver chegando ao limite
- uso de storage estiver aumentando

Objetivo: **permitir planejamento antes de atingir o limite.**

---

## ETAPA 7 — Segurança das alterações

Antes de aplicar qualquer mudança:

- criar branch nova
- não alterar produção diretamente
- testar ambiente local
- rodar testes existentes

Garantir que painel, pedidos e cardápio público continuem funcionando.

---

## ETAPA 8 — Se a implementação for muito grande

Dividir em scripts separados:

1. Auditoria completa do repositório
2. Sistema de screenshots 4K do produto
3. Deploy automático do editor
4. Sistema de métricas de restaurantes
5. Sistema de alerta de capacidade

---

## RESULTADO ESPERADO

- ✔ screenshots profissionais do dashboard
- ✔ imagens 4K do editor
- ✔ deploy automático após edição do cardápio
- ✔ sistema interno de contagem de restaurantes
- ✔ dashboard administrativo
- ✔ alerta de limite de hospedagem
- ✔ melhor controle de crescimento da plataforma
