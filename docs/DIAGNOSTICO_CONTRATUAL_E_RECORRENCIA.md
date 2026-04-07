# Diagnóstico Contratual, Recorrência e Cobrança

## Objetivo

- Consolidar o modelo recomendado de contratação para a plataforma.
- Separar o que pode operar com aceite eletrônico padronizado do que exige contrato específico.
- Definir o desenho correto de cobrança via Mercado Pago para onboarding, mensalidade, upgrade e rede.
- Registrar as inconsistências prioritárias entre produto, copy, termos e operação.

## Resumo executivo

- A plataforma já comunica taxa inicial de implantação e mensalidade recorrente, mas o onboarding inicial ainda opera como cobrança pontual com ativação local de período.
- A cobrança automática mensal por cartão já existe parcialmente no fluxo de assinatura e upgrade via preapproval do Mercado Pago.
- O modelo correto é separar duas trilhas financeiras: mensalidade SaaS cobrada pela Zairyx e pagamentos dos pedidos do delivery recebidos na conta Mercado Pago do cliente.
- Template self-service pode operar com termos + aceite eletrônico, desde que o checkout passe a exibir e registrar um resumo contratual claro.
- Implantação pela equipe, rede, acesso a código-fonte, revenda e licenças ampliadas devem operar com contrato adicional.
- A política fiscal ainda não deve ser automatizada em produção sem validação contábil de enquadramento, CNAE, documento fiscal e regra de emissão.

## Matriz de contratação por fluxo

| Fluxo comercial | O que está sendo vendido | Como cobrar | Documento mínimo recomendado | Exige contrato específico? | Observações |
| --- | --- | --- | --- | --- | --- |
| Template self-service | Implantação inicial + direito de uso do template + acesso ao painel | Cobrança inicial no checkout + adesão à mensalidade | Termos de uso + resumo comercial no checkout + comprovante de aceite | Não, se padronizado | O checkout deve mostrar valor inicial, valor mensal, recorrência, cancelamento e arrependimento antes do pagamento |
| Template com equipe | Implantação assistida + organização do catálogo + ativação do canal | Cobrança inicial maior + mensalidade | Termos + ordem de serviço/proposta com escopo | Sim | Precisa definir prazo, entregáveis, dependências do cliente e limite de ajustes |
| Plano mensal SaaS | Uso continuado da plataforma | Assinatura recorrente via Mercado Pago | Termo de adesão recorrente | Não, se padrão | Precisa deixar claro data de renovação, regra de cancelamento, inadimplência e suspensão |
| Upgrade ou downgrade | Mudança de plano e preço recorrente | Atualização da assinatura existente ou nova assinatura | Aditivo eletrônico curto | Não, se padrão | Deve registrar o novo preço, quando entra em vigor e se a troca vale no mesmo ciclo ou no próximo |
| Rede / multiunidade | Unidade matriz + filiais extras | Mensalidade por unidade extra | Contrato comercial de rede | Sim | Deve definir titularidade da matriz, regra de criação de filiais, permissões, cobrança por unidade e desligamento |
| Repositório privado / código-fonte | Licença comercial de uso ampliado | Pagamento pontual ou plano específico | Licença comercial específica | Sim | Não deve usar apenas termos públicos |
| Revenda / parceiro | Direito comercial de revenda, indicação ou operação de carteira | Comissão, fee ou tabela comercial própria | Contrato de parceria | Sim | Deve definir responsabilidade comercial, marca, suporte, chargeback e repasse |

## Regras mínimas por documento

### 1. Termos públicos

Devem cobrir apenas a camada padronizada do produto:

- identificação completa do fornecedor
- descrição objetiva do serviço
- vinculação da compra à conta autenticada
- preço inicial e referência da mensalidade
- renovação automática
- cancelamento
- direito de arrependimento
- suspensão por inadimplência
- propriedade intelectual básica

### 2. Resumo comercial no checkout

Deve aparecer antes do redirecionamento ao Mercado Pago e ser salvo junto do pedido:

- template escolhido
- modalidade comprada
- valor cobrado agora
- valor da mensalidade após ativação
- forma de renovação
- data ou critério do primeiro ciclo recorrente
- regra de cancelamento
- regra de arrependimento
- identificação do titular da contratação

### 3. Ordem de serviço para implantação pela equipe

Deve incluir:

- escopo da implantação
- quantidade estimada de produtos
- formato de envio do material
- prazo de início e prazo de entrega
- quantidade de revisões incluídas
- itens que não fazem parte do serviço
- condição para considerar onboarding completo

### 4. Contrato de rede

Deve incluir:

- definição de matriz e filiais
- quantidade contratada de unidades extras
- valor mensal por unidade
- política de desconto por volume
- responsabilidade da matriz sobre filiais
- fluxo de inclusão e remoção de unidades
- regra de acesso por e-mail e gestão de contas
- tratamento de inadimplência parcial ou total

### 5. Licença comercial ampliada

Deve incluir:

- escopo de uso autorizado
- restrições de revenda e redistribuição
- vedação de compartilhamento entre empresas do grupo sem autorização
- hipótese de revogação por chargeback, inadimplência ou violação contratual
- prazo de acesso e suporte vinculado

## Modelo correto de cobrança

## Separação obrigatória das trilhas financeiras

### Trilha 1. Mensalidade SaaS da plataforma

- Cobrança na conta Mercado Pago da Zairyx.
- O cliente contrata a plataforma e paga a mensalidade para a Zairyx.
- Idealmente via assinatura recorrente com cartão salvo e renovação automática.

### Trilha 2. Pagamentos dos pedidos do delivery

- Recebimento na conta Mercado Pago do próprio cliente.
- A Zairyx não deve receber o valor dos pedidos do delivery como intermediadora do caixa operacional do cliente, salvo modelo contratual e fiscal totalmente diferente.
- A comunicação comercial deve continuar deixando claro que a taxa do gateway é do Mercado Pago e que o dinheiro do pedido cai na conta do delivery.

## Modelo recomendado de assinatura

### Onboarding inicial

- O checkout cobra a implantação inicial.
- Na mesma jornada, o cliente precisa aderir à mensalidade recorrente.
- O ideal é sair do onboarding já com a assinatura criada no Mercado Pago para evitar gap entre venda e renovação real.

### Renovação mensal

- Deve usar preapproval do Mercado Pago.
- O cartão salvo fica no ambiente do Mercado Pago, não no servidor da plataforma.
- O ciclo mensal precisa ser refletido em banco com datas reais de início, vencimento, atraso, suspensão e reativação.

### Upgrade e downgrade

- Quando houver assinatura existente, atualizar o valor do preapproval.
- Quando não houver assinatura válida, criar nova assinatura antes de confirmar a mudança comercial.
- O produto deve informar de forma inequívoca se a alteração vale imediatamente ou no próximo ciclo.

### Cancelamento

- O cliente precisa conseguir cancelar pelo painel se isso continuar prometido nos termos.
- O cancelamento deve definir se a assinatura encerra no fim do período vigente ou imediatamente.
- A interface deve confirmar a solicitação e registrar protocolo/data.

## Resposta objetiva sobre cartão e cobrança automática

- Sim, é tecnicamente possível o cliente cadastrar cartão e ser cobrado automaticamente todo mês via Mercado Pago.
- Esse modelo já está parcialmente suportado no fluxo de assinatura e upgrade.
- O ponto pendente é tornar a assinatura recorrente parte oficial da compra inicial do template, e não só das mudanças posteriores de plano.

## Quando contrato é realmente necessário

## Aceite eletrônico padronizado é suficiente quando

- o produto é padronizado
- o preço é público
- o escopo é fechado
- o cliente contrata sem negociação individual
- não existe cessão ampliada de código ou revenda

## Contrato específico é necessário quando

- houver implantação pela equipe com escopo variável
- houver rede, grupo econômico ou multiunidade
- houver acesso a repositório privado
- houver revenda, sublicenciamento ou uso por terceiros
- houver negociação fora da oferta pública
- houver SLA, prazo especial, customização relevante ou obrigação comercial bilateral

## Inconsistências prioritárias a corrigir

### Prioridade 1. Recorrência real vs. recorrência prometida

- A vitrine, os termos e o checkout falam em plano mensal e renovação automática.
- O onboarding inicial ainda precisa sair com assinatura recorrente efetiva do Mercado Pago.

### Prioridade 2. Garantia e arrependimento

- Toda a comunicação precisa falar a mesma coisa.
- Se a regra oficial for 7 dias, remover qualquer mensagem pública de 30 dias.
- Se a decisão comercial for 30 dias, atualizar termos, checkout, automações e política de reembolso.

### Prioridade 3. Cancelamento pelo painel

- O termo promete cancelamento pelo painel.
- Isso precisa estar visível e operacional na área do cliente, com linguagem e efeito contratual claros.

### Prioridade 4. Documento fiscal e cadastro do tomador

- Definir com contador se o checkout deve exigir CPF, CNPJ, endereço e razão social em todos os casos ou apenas em alguns.
- Não subir automação fiscal em produção até fechar enquadramento e documento correto.

### Prioridade 5. Documentação interna legada

- Atualizar ou arquivar o documento de fluxo antigo que ainda cita checkout e webhook desativados.

## Plano prático de execução

### Fase 1. Ajuste jurídico-comercial

- Congelar a regra oficial de arrependimento e devolução.
- Definir política oficial de cancelamento.
- Definir política fiscal com contador.
- Fechar modelo de contrato de rede e de licença ampliada.

### Fase 2. Ajuste de produto

- Incluir resumo contratual antes do pagamento.
- Registrar aceite expresso do cliente.
- Tornar a assinatura recorrente parte oficial da compra inicial.
- Expor cancelamento no painel com efeito rastreável.

### Fase 3. Ajuste documental

- Atualizar termos públicos.
- Atualizar documentação interna do fluxo de compra.
- Criar minutas separadas: ordem de serviço, contrato de rede, licença ampliada e parceria.

## Decisão recomendada

- Manter self-service em modelo padronizado com aceite eletrônico reforçado.
- Formalizar implantação pela equipe, rede e licença ampliada com contrato específico.
- Manter pagamentos do delivery na conta Mercado Pago do cliente.
- Cobrar mensalidade SaaS na conta Mercado Pago da Zairyx.
- Priorizar a implantação da recorrência real no onboarding antes de ampliar a comunicação comercial sobre renovação automática.

## Observação

- Este documento organiza risco operacional, contratual e comercial do produto.
- Não substitui parecer jurídico individual nem validação contábil formal.