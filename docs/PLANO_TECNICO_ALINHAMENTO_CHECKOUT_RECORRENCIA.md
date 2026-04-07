# Plano Técnico — Alinhamento de Checkout, Recorrência e Cancelamento

## Objetivo

Alinhar o produto com o modelo comercial e contratual recomendado, eliminando inconsistências entre copy, checkout, renovação automática, cancelamento e operação financeira.

## Resultado esperado

- o checkout inicial passa a registrar aceite claro do resumo contratual
- a compra inicial do template sai com assinatura recorrente efetiva quando esse for o modelo oficial
- o painel expõe cancelamento de forma rastreável
- a comunicação pública reflete exatamente a operação real

## Bloco 1. Resumo contratual no checkout

### Entregas

- bloco visual obrigatório antes do redirecionamento ao pagamento
- registro persistido do resumo aceito no pedido e na sessão de checkout
- texto padronizado para template, implantação, mensalidade, renovação, cancelamento e arrependimento

### Pontos de ajuste

- página de compra por template
- endpoint de iniciar onboarding
- estrutura de metadata do pedido e da checkout_session

## Bloco 2. Aceite expresso

### Entregas

- checkbox de aceite obrigatório no checkout
- link para termos e política correspondente
- persistência do timestamp de aceite e versão do texto

### Regras

- sem aceite não inicia checkout
- o backend deve validar a presença do aceite, não apenas o frontend

## Bloco 3. Recorrência real no onboarding inicial

### Objetivo

Fazer a compra inicial refletir o modelo prometido de mensalidade recorrente.

### Estratégia recomendada

- manter a cobrança inicial da implantação
- criar ou vincular assinatura recorrente do plano mensal ainda na jornada inicial
- registrar identificador do preapproval do Mercado Pago no ciclo de onboarding quando aplicável

### Ajustes técnicos esperados

- revisar o fluxo inicial de pagamento para separar taxa de implantação e adesão recorrente
- adaptar o webhook principal para ativar assinatura real e não só período local
- garantir consistência entre subscriptions, restaurants e checkout_sessions

## Bloco 4. Cancelamento operacional no painel

### Entregas

- ação visível de cancelamento na área de planos
- confirmação com efeito contratual claro
- protocolo, data e motivo opcional
- atualização do status local e sincronização com o provedor quando houver assinatura ativa

### Regras de negócio a congelar antes da implementação

- cancelamento imediato ou fim do ciclo
- reativação manual ou automática
- tratamento de atraso, disputa e chargeback

## Bloco 5. Ajuste de copy pública

### Entregas

- unificar promessa de arrependimento ou garantia
- unificar promessa sobre renovação automática
- deixar explícita a separação entre mensalidade Zairyx e taxas do Mercado Pago

### Superfícies prioritárias

- termos
- funcionalidades
- preços
- templates
- checkout por template

## Bloco 6. Trilhas de auditoria

### Entregas

- versionamento do texto aceito pelo cliente
- trilha de eventos para compra, ativação, renovação, mudança de plano e cancelamento
- logs administrativos mínimos para suporte e disputa

## Ordem de implementação

### Fase 1. Congelamento de regras

- definir política oficial de arrependimento
- definir política oficial de cancelamento
- definir se a recorrência começa já no onboarding ou após ativação

### Fase 2. Checkout e backend

- implementar resumo contratual e aceite expresso
- persistir versão do contrato aceito
- ajustar payload do onboarding para suportar recorrência real

### Fase 3. Assinatura e webhook

- integrar preapproval no fluxo inicial
- harmonizar webhook de onboarding e webhook de subscriptions
- validar atualização de current_period_start e current_period_end por eventos reais

### Fase 4. Painel do cliente

- expor cancelamento
- expor status da assinatura e próxima renovação
- exibir histórico básico de mudança de plano

### Fase 5. Copy e validação final

- alinhar páginas públicas
- alinhar termos
- executar testes manuais de compra, renovação, downgrade, cancelamento e reativação

## Critérios de aceite

- nenhuma página pública pode prometer fluxo que o sistema não execute de verdade
- toda compra deve ter resumo contratual persistido
- toda renovação ou cancelamento deve gerar trilha mínima auditável
- o cliente deve entender claramente o que paga agora, o que paga depois e como cancelar