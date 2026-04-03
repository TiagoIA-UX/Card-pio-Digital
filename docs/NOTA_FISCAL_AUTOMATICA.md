# Nota Fiscal Automática

## Situação atual

- O projeto possui integração de pagamento com Mercado Pago e webhooks de confirmação.
- O projeto não possui hoje integração implementada com provedor de NFS-e ou NF-e.
- Não há rotas, serviços, filas ou persistência dedicadas à emissão fiscal automática.

## Viabilidade técnica

- O envio automático de nota fiscal é viável neste produto.
- O ponto natural de disparo é a confirmação do pagamento aprovada nos webhooks já existentes.
- O fluxo recomendado é: pagamento aprovado -> enfileirar emissão fiscal -> chamar provedor fiscal -> salvar número, XML, PDF e protocolo -> enviar ao cliente por email.

## Integrações recomendadas

- Focus NFe
- eNotas
- PlugNotas
- Webmania

## Exigências e validações antes de automatizar

- Confirmar com contador se o enquadramento fiscal atual permite emissão para a atividade efetivamente vendida pelo produto digital.
- Confirmar inscrição municipal, regime tributário aplicável e tipo de documento correto: NFS-e para serviço, NF-e para mercadoria ou cenário híbrido.
- Confirmar se o CNAE e a descrição da atividade econômica cobrem SaaS, implantação, suporte ou serviços digitais cobrados na plataforma.
- Definir a regra de emissão: no pagamento aprovado, na prestação do serviço, na renovação recorrente ou por evento contratual específico.
- Definir retenção e armazenamento seguro de XML, PDF, protocolo e status de cancelamento.

## Observação cadastral

- Consulta pública realizada em 03/04/2026 para o CNPJ 61.699.939/0001-80 indicou situação cadastral ativa, porte micro empresa, opção pelo Simples e opção pelo MEI.
- A mesma consulta indicou natureza jurídica de Empresário Individual e CNAE principal de comércio varejista especializado de equipamentos de telefonia e comunicação.
- Isso exige validação contábil antes de automatizar emissão fiscal para SaaS ou serviços digitais.

## Recomendação prática

- Não automatizar emissão fiscal em produção antes de validar enquadramento e regras fiscais com contabilidade.
- Depois dessa validação, implementar a integração fiscal conectada aos webhooks já existentes do Mercado Pago.

## Estrutura já preparada no projeto

- Há uma camada central em lib/fiscal.ts para resolver configuração, validar readiness e montar o draft fiscal de cada pagamento aprovado.
- O webhook de onboarding do Mercado Pago agora grava um bloco fiscal no metadata do pedido aprovado, sem emitir nota em produção por padrão.
- A preparação fiscal nasce em modo seguro: feature flag desligada por padrão e dry-run ligado por padrão.
- Com isso, o projeto fica pronto para plugar um provedor fiscal depois da validação contábil, sem alterar o fluxo principal de checkout.
