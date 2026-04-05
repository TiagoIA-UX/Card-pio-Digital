# 📘 E-BOOK — Auditoria E2E Completa do Zairyx

**Versão:** 1.0  
**Data:** Abril 2026  
**Nível:** PhD — Teste de ponta a ponta por persona  
**URL de Produção:** https://www.zairyx.com.br  
**URL Local:** http://localhost:3000

> **REGRA DE OURO:** Este documento é SOMENTE LEITURA para o sistema.  
> Nenhuma automação deve alterar código existente com base neste guia.  
> Cada teste é manual e executado pelo operador humano.

---

## 📋 ÍNDICE

1. [Pré-requisitos](#1-pré-requisitos)
2. [Persona 1 — Visitante Anônimo](#2-persona-1--visitante-anônimo)
3. [Persona 2 — Cliente Final (Consumidor)](#3-persona-2--cliente-final)
4. [Persona 3 — Dono do Delivery](#4-persona-3--dono-do-delivery)
5. [Persona 4 — Staff / Funcionário](#5-persona-4--staff--funcionário)
6. [Persona 5 — Gerente](#6-persona-5--gerente)
7. [Persona 6 — Afiliado](#7-persona-6--afiliado)
8. [Persona 7 — Revendedor](#8-persona-7--revendedor)
9. [Persona 8 — Suporte (Agente)](#9-persona-8--suporte)
10. [Persona 9 — Administrador](#10-persona-9--administrador)
11. [Persona 10 — Owner (Dono da Plataforma)](#11-persona-10--owner)
12. [Testes Cross-Persona](#12-testes-cross-persona)
13. [Testes de Segurança](#13-testes-de-segurança)
14. [Testes de Performance & SEO](#14-testes-de-performance--seo)
15. [Testes Mobile](#15-testes-mobile)
16. [Checklist Final de Aprovação](#16-checklist-final-de-aprovação)

---

## 1. PRÉ-REQUISITOS

### Ambiente

| Item               | Comando/Ação                    | Esperado                            |
| ------------------ | ------------------------------- | ----------------------------------- |
| Node.js rodando    | `node -v`                       | v20.x, 22.x ou 24.x                 |
| Servidor dev ativo | `npm run dev`                   | http://localhost:3000 abre sem erro |
| Doctor OK          | `npm run doctor`                | Todas as variáveis ✅               |
| Supabase conectado | Acessar `/api/health`           | `{ "status": "ok" }`                |
| Produção acessível | Abrir https://www.zairyx.com.br | Página carrega sem erro             |

### Contas de Teste Necessárias

| Persona          | Email sugerido                                 | Senha               |
| ---------------- | ---------------------------------------------- | ------------------- |
| Dono do Delivery | `teste-dono@teste.com`                         | (criar no cadastro) |
| Staff            | (convidado pelo dono)                          | —                   |
| Gerente          | (convidado pelo dono)                          | —                   |
| Afiliado         | `teste-afiliado@teste.com`                     | (criar no cadastro) |
| Admin            | (precisa ser inserido na tabela `admin_users`) | —                   |

### Convenção de Status

- ✅ = Passou
- ❌ = Falhou (anotar o que aconteceu)
- ⏭️ = Pulei (motivo)
- 🔄 = Precisa re-testar

---

## 2. PERSONA 1 — VISITANTE ANÔNIMO

**Quem é:** Qualquer pessoa que acessa o site pela primeira vez, sem login.

### 2.1 Landing Page

| #   | Teste                  | Passos                                             | Resultado esperado                           | Status |
| --- | ---------------------- | -------------------------------------------------- | -------------------------------------------- | ------ |
| V01 | Página inicial carrega | Acessar `/`                                        | Hero, benefícios, preços e footer visíveis   | ☐      |
| V02 | Menu de navegação      | Clicar em cada item do header                      | Navega para a seção/página correta           | ☐      |
| V03 | CTA principal          | Clicar em "Criar meu cardápio" (ou equivalente)    | Redireciona para `/cadastro`                 | ☐      |
| V04 | Scroll animations      | Scroll lento pela página                           | Animações de reveal funcionam sem travamento | ☐      |
| V05 | Calculadora de ROI     | Acessar `/quanto-posso-lucrar` e preencher valores | Cálculo exibe economia anual vs iFood        | ☐      |

### 2.2 Templates & Preços

| #   | Teste               | Passos                                            | Resultado esperado                     | Status |
| --- | ------------------- | ------------------------------------------------- | -------------------------------------- | ------ |
| V06 | Página de templates | Acessar `/templates`                              | Lista de 15 templates com preview      | ☐      |
| V07 | Template individual | Clicar em um template (ex: `/templates/pizzaria`) | Preview do template com CTA de compra  | ☐      |
| V08 | Página de preços    | Acessar `/precos`                                 | Planos visíveis com valores e features | ☐      |
| V09 | Comparação iFood    | Acessar `/beneficios`                             | Tabela comparativa Zairyx vs iFood     | ☐      |
| V10 | Funcionalidades     | Acessar `/funcionalidades`                        | Lista completa de features             | ☐      |

### 2.3 Páginas Legais

| #   | Teste                   | Passos                           | Resultado esperado               | Status |
| --- | ----------------------- | -------------------------------- | -------------------------------- | ------ |
| V11 | Termos de uso           | Acessar `/termos`                | Conteúdo renderiza completo      | ☐      |
| V12 | Política de privacidade | Acessar `/privacidade`           | Conteúdo renderiza completo      | ☐      |
| V13 | Política de cookies     | Acessar `/cookies`               | Conteúdo renderiza completo      | ☐      |
| V14 | Banner de cookies       | Primeira visita (limpar cookies) | Banner aparece, aceitar funciona | ☐      |

### 2.4 Google Meu Negócio

| #   | Teste      | Passos                        | Resultado esperado                  | Status |
| --- | ---------- | ----------------------------- | ----------------------------------- | ------ |
| V15 | Página GMN | Acessar `/google-meu-negocio` | Guia completo renderiza             | ☐      |
| V16 | CTA do GMN | Clicar no CTA final           | Redireciona para `/` ou `/cadastro` | ☐      |

### 2.5 Demo

| #   | Teste                     | Passos                                      | Resultado esperado                              | Status |
| --- | ------------------------- | ------------------------------------------- | ----------------------------------------------- | ------ |
| V17 | Demo dashboard            | Acessar `/demo`                             | Dashboard demo com menu lateral funcional       | ☐      |
| V18 | Demo editor               | Acessar `/demo/editor`                      | Editor visual com CRUD de produtos e categorias | ☐      |
| V19 | Demo — adicionar produto  | No editor demo, clicar "Adicionar produto"  | Produto criado com valores padrão               | ☐      |
| V20 | Demo — editar produto     | Clicar num produto e mudar nome/preço       | Mudanças refletem no preview                    | ☐      |
| V21 | Demo — excluir produto    | Hover no produto → clicar lixeira           | Produto removido                                | ☐      |
| V22 | Demo — renomear categoria | Hover no header da categoria → clicar lápis | Input inline aparece, renomeia ao confirmar     | ☐      |
| V23 | Demo — clonar categoria   | Hover no header → clicar duplicar           | Categoria duplicada com "(cópia)"               | ☐      |
| V24 | Demo — excluir categoria  | Hover no header → clicar lixeira            | Categoria removida com todos os produtos        | ☐      |

---

## 3. PERSONA 2 — CLIENTE FINAL

**Quem é:** O consumidor que escaneia o QR Code e faz pedido pelo cardápio.

### Pré-requisito

- Ter um delivery cadastrado com produtos e categorias (usar o da Persona 3)
- Saber o slug do delivery (ex: `/r/pizzaria-teste`)

### 3.1 Navegação do Cardápio

| #   | Teste                    | Passos                       | Resultado esperado                                   | Status |
| --- | ------------------------ | ---------------------------- | ---------------------------------------------------- | ------ |
| C01 | Acesso ao cardápio       | Acessar `/r/[slug]`          | Cardápio público carrega com logo, nome e categorias | ☐      |
| C02 | Navegação por categorias | Clicar nas tabs de categoria | Scroll ou filtro para a seção correta                | ☐      |
| C03 | Detalhe de produto       | Clicar num produto           | Modal/page com foto, descrição e preço               | ☐      |
| C04 | Produto sem imagem       | Ter um produto sem foto      | Placeholder visível (não quebra layout)              | ☐      |

### 3.2 Pizza Builder (se aplicável)

| #   | Teste              | Passos                                  | Resultado esperado              | Status |
| --- | ------------------ | --------------------------------------- | ------------------------------- | ------ |
| C05 | Selecionar tamanho | Abrir pizza e escolher P/M/G/GG         | Preço atualiza conforme tamanho | ☐      |
| C06 | Meia-pizza         | Selecionar 2 sabores para meia          | Preço = maior dos dois sabores  | ☐      |
| C07 | Borda recheada     | Selecionar borda                        | Preço adiciona valor da borda   | ☐      |
| C08 | Adicionais         | Selecionar adicionais (ex: bacon extra) | Preço soma corretamente         | ☐      |
| C09 | Limite de sabores  | Tentar add mais sabores que o permitido | Bloqueio com mensagem clara     | ☐      |

### 3.3 Carrinho

| #   | Teste                 | Passos                                | Resultado esperado                       | Status |
| --- | --------------------- | ------------------------------------- | ---------------------------------------- | ------ |
| C10 | Adicionar ao carrinho | Clicar "Adicionar" em um produto      | Drawer do carrinho abre com item         | ☐      |
| C11 | Quantidade            | Usar +/- no carrinho                  | Quantidade e subtotal atualizam          | ☐      |
| C12 | Remover item          | Clicar em remover no carrinho         | Item some, total recalcula               | ☐      |
| C13 | Carrinho vazio        | Remover todos os itens                | Mensagem "carrinho vazio", CTA de voltar | ☐      |
| C14 | Persistência          | Adicionar item → fechar aba → reabrir | Carrinho mantém itens (localStorage)     | ☐      |
| C15 | Múltiplos produtos    | Adicionar 3+ produtos diferentes      | Total soma corretamente                  | ☐      |

### 3.4 Checkout & Pedido

| #   | Teste                   | Passos                                   | Resultado esperado                                    | Status |
| --- | ----------------------- | ---------------------------------------- | ----------------------------------------------------- | ------ |
| C16 | Formulário de dados     | Preencher nome, telefone, endereço       | Campos validam (telefone format, campos obrigatórios) | ☐      |
| C17 | Cupom válido            | Inserir cupom existente e clicar validar | Desconto aplicado, total recalcula                    | ☐      |
| C18 | Cupom inválido          | Inserir cupom inexistente                | Mensagem de erro clara                                | ☐      |
| C19 | Enviar pedido           | Preencher tudo e enviar                  | Número de pedido gerado, redirecionamento             | ☐      |
| C20 | Double-click protection | Clicar "Enviar" rapidamente 5x           | Apenas 1 pedido criado (debounce)                     | ☐      |
| C21 | WhatsApp                | Após criar pedido                        | Link WhatsApp formatado com itens, endereço e total   | ☐      |
| C22 | Status do pedido        | Acessar `/status?numero=[NUM]`           | Status atual visível (ex: "Pendente")                 | ☐      |

### 3.5 Testes de Abuso

| #   | Teste             | Passos                                         | Resultado esperado                                  | Status |
| --- | ----------------- | ---------------------------------------------- | --------------------------------------------------- | ------ |
| C23 | Preço adulterado  | Abrir DevTools → mudar preço no DOM → enviar   | Servidor recalcula com snapshot real, preço correto | ☐      |
| C24 | XSS no nome       | Preencher nome com `<script>alert(1)</script>` | Texto exibido como texto, não executado             | ☐      |
| C25 | SQL injection     | Preencher campo com `'; DROP TABLE orders; --` | Erro de validação ou texto tratado, sem crash       | ☐      |
| C26 | Telefone inválido | Digitar letras no campo telefone               | Validação bloqueia envio                            | ☐      |

---

## 4. PERSONA 3 — DONO DO DELIVERY

**Quem é:** O proprietário do delivery que contrata a plataforma.

### 4.1 Cadastro & Onboarding

| #   | Teste                    | Passos                                           | Resultado esperado                                            | Status |
| --- | ------------------------ | ------------------------------------------------ | ------------------------------------------------------------- | ------ |
| D01 | Criar conta              | Acessar `/cadastro`, preencher email+senha       | Conta criada, email de confirmação enviado                    | ☐      |
| D02 | Confirmar email          | Clicar no link do email                          | Conta verificada, redireciona para login                      | ☐      |
| D03 | Login                    | Acessar `/login`, preencher credenciais          | Redireciona para `/onboarding` (primeiro acesso) ou `/painel` | ☐      |
| D04 | Onboarding               | Preencher: nome, CNPJ, WhatsApp, endereço, plano | Tenant criado, redireciona para `/painel`                     | ☐      |
| D05 | Onboarding — campo vazio | Deixar campo obrigatório vazio                   | Validação impede prosseguir                                   | ☐      |

### 4.2 Painel — Categorias & Produtos

| #   | Teste                 | Passos                                      | Resultado esperado                                 | Status |
| --- | --------------------- | ------------------------------------------- | -------------------------------------------------- | ------ |
| D06 | Criar categoria       | `/painel/categorias` → nova categoria       | Categoria criada e visível na lista                | ☐      |
| D07 | Renomear categoria    | Clicar em editar no nome                    | Nome atualizado                                    | ☐      |
| D08 | Excluir categoria     | Clicar excluir em categoria COM produtos    | Alerta de confirmação, exclui categoria e produtos | ☐      |
| D09 | Criar produto         | `/painel/produtos` → novo produto           | Form com nome, preço, descrição, foto              | ☐      |
| D10 | Upload de imagem      | No form de produto, selecionar imagem       | Upload para R2, preview aparece                    | ☐      |
| D11 | Imagem grande (>5MB)  | Tentar upload de foto enorme                | Erro com mensagem de limite                        | ☐      |
| D12 | Editar preço          | Mudar preço de um produto existente         | Preço atualizado no cardápio público               | ☐      |
| D13 | Excluir produto       | Clicar excluir em produto                   | Produto removido, cardápio público atualiza        | ☐      |
| D14 | Produto com variantes | Criar produto com P/M/G e preços diferentes | Variantes salvas e exibidas no cardápio            | ☐      |
| D15 | Reordenar categorias  | Arrastar categoria para mudar ordem         | Ordem refletida no cardápio público                | ☐      |

### 4.3 Editor Visual

| #   | Teste                    | Passos                                     | Resultado esperado                    | Status |
| --- | ------------------------ | ------------------------------------------ | ------------------------------------- | ------ |
| D16 | Abrir editor             | `/painel/editor`                           | Preview do template carrega           | ☐      |
| D17 | Mudar cores              | Alterar cor primária/secundária            | Preview atualiza em tempo real        | ☐      |
| D18 | Mudar logo               | Upload novo logo                           | Logo aparece no preview e no cardápio | ☐      |
| D19 | Add produto no editor    | Clicar "Adicionar produto em [categoria]"  | Produto com valores padrão criado     | ☐      |
| D20 | Editar inline no editor  | Clicar no produto → editar nome/preço      | Mudanças salvam e refletem            | ☐      |
| D21 | Excluir no editor        | Hover → lixeira                            | Produto removido do preview           | ☐      |
| D22 | Clonar produto           | Hover → duplicar                           | Produto duplicado com "(cópia)"       | ☐      |
| D23 | CRUD categoria no editor | Renomear, clonar, excluir categoria inline | Todas as ações funcionam no preview   | ☐      |
| D24 | Salvar template          | Clicar salvar                              | Alterações persistem ao recarregar    | ☐      |

### 4.4 Pedidos

| #   | Teste                     | Passos                                                          | Resultado esperado                | Status |
| --- | ------------------------- | --------------------------------------------------------------- | --------------------------------- | ------ |
| D25 | Listar pedidos            | `/painel/pedidos`                                               | Lista com pedidos recentes        | ☐      |
| D26 | Mudar status              | Clicar para avançar status (pendente → confirmado)              | Status muda, timestamp registrado | ☐      |
| D27 | Fluxo completo de status  | Avançar: pendente → confirmado → preparando → pronto → entregue | Todos os passos funcionam         | ☐      |
| D28 | Pedido novo em tempo real | Criar pedido pelo cardápio público                              | Aparece na lista sem refresh      | ☐      |

### 4.5 Configurações

| #   | Teste                    | Passos                               | Resultado esperado                    | Status |
| --- | ------------------------ | ------------------------------------ | ------------------------------------- | ------ |
| D29 | Editar nome              | `/painel/configuracoes` → mudar nome | Nome atualizado no cardápio público   | ☐      |
| D30 | Horário de funcionamento | Definir horários                     | Cardápio mostra status aberto/fechado | ☐      |
| D31 | Dados de pagamento PIX   | Configurar chave PIX                 | Chave salva e usada no checkout       | ☐      |
| D32 | WhatsApp                 | Mudar número                         | Novo número usado nos links de pedido | ☐      |

### 4.6 QR Code

| #   | Teste         | Passos                              | Resultado esperado                      | Status |
| --- | ------------- | ----------------------------------- | --------------------------------------- | ------ |
| D33 | Gerar QR Code | `/painel/qrcode`                    | QR renderiza apontando para `/r/[slug]` | ☐      |
| D34 | Download QR   | Clicar em download                  | Arquivo PNG/SVG baixado                 | ☐      |
| D35 | Escanear QR   | Usar câmera do celular no QR gerado | Abre o cardápio correto no navegador    | ☐      |

### 4.7 Planos & Pagamento

| #   | Teste            | Passos                        | Resultado esperado                     | Status |
| --- | ---------------- | ----------------------------- | -------------------------------------- | ------ |
| D36 | Ver plano atual  | `/painel/planos`              | Plano ativo exibido com features       | ☐      |
| D37 | Upgrade de plano | Clicar em upgrade             | Redireciona para checkout Mercado Pago | ☐      |
| D38 | Trial expirando  | (se em trial) Verificar aviso | Banner de expiração visível            | ☐      |

### 4.8 Métricas & Feedback

| #   | Teste              | Passos              | Resultado esperado                   | Status |
| --- | ------------------ | ------------------- | ------------------------------------ | ------ |
| D39 | Dashboard métricas | `/painel/metricas`  | Gráficos de vendas, pedidos, receita | ☐      |
| D40 | Feedbacks          | `/painel/feedbacks` | Lista de avaliações de clientes      | ☐      |

---

## 5. PERSONA 4 — STAFF / FUNCIONÁRIO

**Quem é:** Funcionário convidado pelo dono, com acesso limitado.

| #   | Teste                    | Passos                                 | Resultado esperado                                          | Status |
| --- | ------------------------ | -------------------------------------- | ----------------------------------------------------------- | ------ |
| S01 | Login staff              | Fazer login com conta de staff         | Redireciona para `/painel/pedidos` (não `/painel` completo) | ☐      |
| S02 | Ver fila de pedidos      | Acessar `/painel/pedidos`              | Pedidos do delivery visíveis                                | ☐      |
| S03 | Mudar status pedido      | Avançar status de um pedido            | Status muda normalmente                                     | ☐      |
| S04 | Bloqueio — produtos      | Tentar acessar `/painel/produtos`      | Acesso negado ou menu oculto                                | ☐      |
| S05 | Bloqueio — configurações | Tentar acessar `/painel/configuracoes` | Acesso negado ou menu oculto                                | ☐      |
| S06 | Bloqueio — planos        | Tentar acessar `/painel/planos`        | Acesso negado ou menu oculto                                | ☐      |
| S07 | Bloqueio — editor        | Tentar acessar `/painel/editor`        | Acesso negado ou menu oculto                                | ☐      |

---

## 6. PERSONA 5 — GERENTE

**Quem é:** Gerente do delivery, com permissões intermediárias.

| #   | Teste              | Passos                           | Resultado esperado                            | Status |
| --- | ------------------ | -------------------------------- | --------------------------------------------- | ------ |
| G01 | Login gerente      | Fazer login com conta de gerente | Redireciona para `/painel` com menu expandido | ☐      |
| G02 | CRUD produtos      | Criar, editar, excluir produto   | Funciona normalmente                          | ☐      |
| G03 | Ver pedidos        | Acessar `/painel/pedidos`        | Lista + transição de status                   | ☐      |
| G04 | Ver feedbacks      | Acessar `/painel/feedbacks`      | Feedbacks visíveis                            | ☐      |
| G05 | Bloqueio — planos  | Tentar acessar `/painel/planos`  | Acesso negado ou menu oculto                  | ☐      |
| G06 | Bloqueio — equipe  | Tentar gerenciar staff           | Sem permissão                                 | ☐      |
| G07 | Bloqueio — billing | Tentar acessar financeiro        | Acesso negado                                 | ☐      |

---

## 7. PERSONA 6 — AFILIADO

**Quem é:** Pessoa que indica deliverys em troca de comissão.

### 7.1 Registro & Dashboard

| #   | Teste               | Passos                          | Resultado esperado                         | Status |
| --- | ------------------- | ------------------------------- | ------------------------------------------ | ------ |
| A01 | Página de afiliados | Acessar `/afiliados`            | Dashboard ou página de registro            | ☐      |
| A02 | Status da inscrição | Se registro desativado (410)    | Mensagem informativa de "programa fechado" | ☐      |
| A03 | Dashboard logado    | Login como afiliado aprovado    | Tier atual, saldo, referrals               | ☐      |
| A04 | Link de referral    | Copiar link de indicação        | Link no formato `/r/[codigo]`              | ☐      |
| A05 | Saldo detalhado     | Acessar `/afiliados/saldo-info` | Saldo pendente, aprovado, bloqueado        | ☐      |
| A06 | Ranking             | Acessar `/afiliados/ranking`    | Posição no ranking + tier                  | ☐      |

### 7.2 Fluxo de Indicação

| #   | Teste               | Passos                                      | Resultado esperado                           | Status |
| --- | ------------------- | ------------------------------------------- | -------------------------------------------- | ------ |
| A07 | Indicação rastreada | Abrir link de referral → cadastrar delivery | Referral registrado em `affiliate_referrals` | ☐      |
| A08 | Comissão creditada  | Após pagamento do delivery indicado         | 30% aparece em saldo_pendente                | ☐      |
| A09 | Tier progressão     | Acumular referrals suficientes              | Tier sobe (ex: Trainee → Analista)           | ☐      |

### 7.3 Pagamento

| #   | Teste              | Passos                         | Resultado esperado              | Status |
| --- | ------------------ | ------------------------------ | ------------------------------- | ------ |
| A10 | Dados PIX          | Configurar chave PIX no perfil | PIX salvo e validado            | ☐      |
| A11 | PIX inválido       | Inserir chave PIX malformada   | Validação rejeita               | ☐      |
| A12 | Solicitar saque    | Ter saldo ≥ R$100              | Saque solicitado com sucesso    | ☐      |
| A13 | Saque insuficiente | Ter saldo < R$100              | Bloqueio com mensagem do mínimo | ☐      |

### 7.4 Penalidades

| #   | Teste                 | Passos                                 | Resultado esperado                            | Status |
| --- | --------------------- | -------------------------------------- | --------------------------------------------- | ------ |
| A14 | Strike aplicado       | (via admin) Aplicar strike no afiliado | Strike visível no painel do afiliado          | ☐      |
| A15 | 3 strikes = suspensão | Acumular 3 strikes                     | Status muda para "suspenso", acesso bloqueado | ☐      |

---

## 8. PERSONA 7 — REVENDEDOR

**Quem é:** Compra pacotes de templates em bulk para revender.

| #   | Teste               | Passos                                                | Resultado esperado                    | Status |
| --- | ------------------- | ----------------------------------------------------- | ------------------------------------- | ------ |
| R01 | Página revendedores | Acessar `/revendedores`                               | Informações do programa               | ☐      |
| R02 | Comprar pacote      | Acessar `/finalizar-compra-pacote` → checkout         | Checkout Mercado Pago abre            | ☐      |
| R03 | Pacote provisionado | Após pagamento confirmado (webhook)                   | Pacote aparece com inventário correto | ☐      |
| R04 | Ativar template     | Selecionar template do pacote → ativar para um tenant | Template ativado, contador diminui    | ☐      |
| R05 | Limite de licenças  | Tentar ativar mais que o comprado                     | Erro: "licenças esgotadas"            | ☐      |
| R06 | Inventário correto  | Verificar contador após ativações                     | Comprado - Usado = Restante           | ☐      |

---

## 9. PERSONA 8 — SUPORTE

**Quem é:** Agente de suporte com acesso ao admin limitado.

### Pré-requisito

- Ter registro na tabela `admin_users` com role = `support`

| #    | Teste                 | Passos                              | Resultado esperado                       | Status |
| ---- | --------------------- | ----------------------------------- | ---------------------------------------- | ------ |
| SP01 | Login admin           | Login normal → redireciona `/admin` | Dashboard admin renderiza                | ☐      |
| SP02 | Fila de tickets       | Acessar `/admin/suporte`            | Tickets ordenados por SLA                | ☐      |
| SP03 | Abrir ticket          | Clicar em um ticket                 | Histórico de mensagens + dados do tenant | ☐      |
| SP04 | Responder ticket      | Escrever reply e enviar             | Mensagem registrada, SLA timer reseta    | ☐      |
| SP05 | SLA visual            | Ticket próximo de vencer SLA        | Indicador vermelho/urgente visível       | ☐      |
| SP06 | Escalar ticket        | Mudar assignment para admin         | Ticket transferido                       | ☐      |
| SP07 | Fechar ticket         | Marcar como resolvido               | Status "closed", resolved_at preenchido  | ☐      |
| SP08 | Bloqueio — financeiro | Tentar acessar `/admin/financeiro`  | Acesso negado (role weight insuficiente) | ☐      |
| SP09 | Bloqueio — usuários   | Tentar acessar `/admin/usuarios`    | Acesso negado                            | ☐      |
| SP10 | Bloqueio — métricas   | Tentar acessar `/admin/metrics`     | Acesso negado ou leitura limitada        | ☐      |

---

## 10. PERSONA 9 — ADMINISTRADOR

**Quem é:** Admin completo da plataforma, abaixo do owner.

### Pré-requisito

- Registro em `admin_users` com role = `admin`

### 10.1 Dashboard & Métricas

| #    | Teste               | Passos                   | Resultado esperado                      | Status |
| ---- | ------------------- | ------------------------ | --------------------------------------- | ------ |
| AD01 | Dashboard admin     | Acessar `/admin`         | Cards de MRR, churn, pedidos, conversão | ☐      |
| AD02 | Métricas detalhadas | Acessar `/admin/metrics` | Gráficos e dados analíticos             | ☐      |
| AD03 | Alertas do sistema  | Acessar `/admin/alertas` | SLA violado, trials expirando, etc      | ☐      |
| AD04 | Logs de auditoria   | Acessar `/admin/logs`    | Trilha de ações com timestamp           | ☐      |

### 10.2 Gestão de Tenants

| #    | Teste            | Passos                          | Resultado esperado                      | Status |
| ---- | ---------------- | ------------------------------- | --------------------------------------- | ------ |
| AD05 | Listar clientes  | Acessar `/admin/clientes`       | Lista paginada de deliverys             | ☐      |
| AD06 | Suspender tenant | Selecionar delivery → suspender | Status muda, cardápio fica indisponível | ☐      |
| AD07 | Reativar tenant  | Reativar delivery suspenso      | Status volta ao normal                  | ☐      |
| AD08 | Mudar plano      | Trocar plano de um delivery     | Plano atualizado                        | ☐      |
| AD09 | Trials           | Acessar `/admin/trials`         | Lista de trials ativos com expiração    | ☐      |

### 10.3 Afiliados & Financeiro

| #    | Teste            | Passos                                   | Resultado esperado                | Status |
| ---- | ---------------- | ---------------------------------------- | --------------------------------- | ------ |
| AD10 | Listar afiliados | Acessar `/admin/afiliados`               | Lista com tier, status, saldo     | ☐      |
| AD11 | Aplicar strike   | Selecionar afiliado → aplicar penalidade | Strike registrado                 | ☐      |
| AD12 | Processar payout | Aprovar pagamento de comissão            | Saldo debitado, ledger registrado | ☐      |
| AD13 | Financeiro       | Acessar `/admin/financeiro`              | Ledger de transações              | ☐      |

### 10.4 Venda Direta

| #    | Teste           | Passos                                           | Resultado esperado               | Status |
| ---- | --------------- | ------------------------------------------------ | -------------------------------- | ------ |
| AD14 | Criar venda     | POST `/api/admin/venda-direta` com dados válidos | Tenant provisionado sem checkout | ☐      |
| AD15 | Venda sem dados | POST com body vazio                              | Erro 400 (validação Zod)         | ☐      |

### 10.5 Suporte (visão admin)

| #    | Teste                 | Passos                   | Resultado esperado                   | Status |
| ---- | --------------------- | ------------------------ | ------------------------------------ | ------ |
| AD16 | Ver tickets completos | Acessar `/admin/suporte` | Todos os tickets de todos os tenants | ☐      |
| AD17 | Reatribuir ticket     | Mudar agente de suporte  | Ticket transferido                   | ☐      |

### 10.6 Bloqueios do Admin

| #    | Teste                | Passos                                 | Resultado esperado                  | Status |
| ---- | -------------------- | -------------------------------------- | ----------------------------------- | ------ |
| AD18 | Não pode criar owner | Tentar criar admin_user com role=owner | Bloqueio (role weight insuficiente) | ☐      |
| AD19 | Pode criar support   | Criar admin_user com role=support      | Criado com sucesso                  | ☐      |

---

## 11. PERSONA 10 — OWNER

**Quem é:** Dono da plataforma. Acesso irrestrito.

### Pré-requisito

- Registro em `admin_users` com role = `owner`

| #    | Teste              | Passos                                          | Resultado esperado                     | Status |
| ---- | ------------------ | ----------------------------------------------- | -------------------------------------- | ------ |
| OW01 | Acesso total       | Navegar por TODAS as páginas admin              | Nenhum bloqueio                        | ☐      |
| OW02 | Criar admin        | Criar novo admin_users com role=admin           | Criado com sucesso                     | ☐      |
| OW03 | Criar owner        | Criar admin_users com role=owner                | Criado com sucesso (apenas owner pode) | ☐      |
| OW04 | Visão cross-tenant | Ver dados de qualquer delivery                  | Dados acessíveis                       | ☐      |
| OW05 | Auth via header    | `Authorization: Bearer ADMIN_SECRET_KEY` em API | Acesso como owner                      | ☐      |
| OW06 | Auth via session   | Login normal no browser                         | Acesso como owner                      | ☐      |
| OW07 | Repo access        | `/admin/repo-access` → conceder acesso          | Acesso ao repo privado registrado      | ☐      |
| OW08 | Cron health        | GET `/api/cron/health` com CRON_SECRET          | Retorna status OK                      | ☐      |
| OW09 | Cron SLA check     | GET `/api/cron/check-sla` com CRON_SECRET       | Execução sem erro                      | ☐      |
| OW10 | Cron trial check   | GET `/api/cron/trial-check` com CRON_SECRET     | Trials expirados processados           | ☐      |

---

## 12. TESTES CROSS-PERSONA

Testes que envolvem interação entre múltiplas personas.

| #   | Teste                   | Personas                  | Passos                                                                                     | Resultado esperado   | Status |
| --- | ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------ | -------------------- | ------ |
| X01 | Pedido ponta a ponta    | Cliente → Dono            | Cliente faz pedido → Dono vê na fila → Avança status → Cliente vê atualização              | ☐                    |
| X02 | Indicação de afiliado   | Afiliado → Dono           | Afiliado compartilha link → Dono se cadastra por ele → Paga → Comissão aparece no afiliado | ☐                    |
| X03 | Ticket de suporte       | Dono → Suporte → Admin    | Dono abre ticket → Suporte responde → Admin vê no painel                                   | ☐                    |
| X04 | Venda direta            | Admin → Dono              | Admin cria venda direta → Dono recebe acesso ao painel                                     | ☐                    |
| X05 | Revendedor → Tenant     | Revendedor → Dono         | Revendedor compra pacote → Ativa template para um dono                                     | ☐                    |
| X06 | Strike → Suspensão      | Admin → Afiliado          | Admin aplica 3 strikes → Afiliado suspenso automaticamente                                 | ☐                    |
| X07 | Trial expirado          | Sistema → Dono            | Cron detecta trial vencido → Dono vê aviso de upgrade                                      | ☐                    |
| X08 | SLA violado             | Sistema → Suporte → Admin | Ticket sem resposta → Cron marca SLA violado → Alerta no admin                             | ☐                    |
| X09 | Isolamento multi-tenant | Dono A → Dono B           | Dono A não vê dados/pedidos/produtos do Dono B                                             | ☐                    |
| X10 | Staff do tenant errado  | Staff → Outro tenant      | Staff tenta acessar dados de outro delivery                                                | Bloqueio total (RLS) | ☐      |

---

## 13. TESTES DE SEGURANÇA

| #     | Teste                         | Passos                                                 | Resultado esperado         | Status |
| ----- | ----------------------------- | ------------------------------------------------------ | -------------------------- | ------ |
| SEC01 | API admin sem auth            | GET `/api/admin/clientes` sem header                   | 401 ou 403                 | ☐      |
| SEC02 | API admin com secret errado   | Authorization: Bearer wrong-key                        | 401 ou 403                 | ☐      |
| SEC03 | API support acessando owner   | Login como support → GET `/api/admin/usuarios`         | 403 (role weight)          | ☐      |
| SEC04 | RLS - tenant isolation        | Usando token do tenant A, query dados do tenant B      | Vazio ou erro              | ☐      |
| SEC05 | Rate limiting                 | 50+ requests em 10s para `/api/checkout/validar-cupom` | 429 Too Many Requests      | ☐      |
| SEC06 | CORS                          | Fetch de domínio externo para `/api/`                  | Headers CORS corretos      | ☐      |
| SEC07 | Injection no search           | SQLi na busca de produtos                              | Sem resultado, sem crash   | ☐      |
| SEC08 | Upload malicioso              | Upload de .exe renomeado para .jpg                     | Rejeitado (validação MIME) | ☐      |
| SEC09 | JWT expirado                  | Usar token expirado em API                             | 401                        | ☐      |
| SEC10 | Webhook sem signature         | POST `/api/webhook/mercadopago` sem x-signature        | 401 ou 400                 | ☐      |
| SEC11 | Path traversal                | Tentar `../../../etc/passwd` em upload                 | Bloqueado                  | ☐      |
| SEC12 | IDOR — pedido de outro tenant | GET `/api/orders?id=[uuid-outro-tenant]`               | 404 ou vazio (RLS)         | ☐      |

---

## 14. TESTES DE PERFORMANCE & SEO

| #    | Teste                         | Ferramenta                                    | Resultado esperado                            | Status |
| ---- | ----------------------------- | --------------------------------------------- | --------------------------------------------- | ------ |
| PF01 | Lighthouse — Homepage         | Chrome DevTools → Lighthouse                  | Performance ≥ 80, SEO ≥ 90                    | ☐      |
| PF02 | Lighthouse — Cardápio público | Lighthouse em `/r/[slug]`                     | Performance ≥ 75                              | ☐      |
| PF03 | Core Web Vitals               | PageSpeed Insights                            | LCP < 2.5s, FID < 100ms, CLS < 0.1            | ☐      |
| PF04 | Sitemap                       | Acessar `/sitemap.xml`                        | XML válido com todas as rotas públicas        | ☐      |
| PF05 | Robots.txt                    | Acessar `/robots.txt`                         | Disallow: /painel, /admin, /api               | ☐      |
| PF06 | Meta tags — Home              | Inspecionar `<head>` de `/`                   | title, description, og:image presentes        | ☐      |
| PF07 | Meta tags — Template          | Inspecionar `<head>` de `/templates/pizzaria` | Metadata específica do template               | ☐      |
| PF08 | 404 page                      | Acessar `/pagina-inexistente`                 | Página 404 customizada, status 404            | ☐      |
| PF09 | Redirect www                  | Acessar `https://zairyx.com.br` (sem www)     | Redirect 308 para `https://www.zairyx.com.br` | ☐      |
| PF10 | SSL                           | Verificar certificado                         | Válido, HSTS ativo                            | ☐      |

---

## 15. TESTES MOBILE

| #    | Teste              | Device            | Resultado esperado                             | Status |
| ---- | ------------------ | ----------------- | ---------------------------------------------- | ------ |
| MB01 | Homepage — iPhone  | Safari iOS        | Layout responsivo, CTAs visíveis               | ☐      |
| MB02 | Homepage — Android | Chrome Android    | Layout responsivo, CTAs visíveis               | ☐      |
| MB03 | Cardápio público   | Mobile real       | Categorias, produtos, carrinho funcionam       | ☐      |
| MB04 | Pizza builder      | Mobile real       | Seleção de sabores, tamanho, borda funciona    | ☐      |
| MB05 | Checkout           | Mobile real       | Form preenche, teclado numério no telefone     | ☐      |
| MB06 | Painel do dono     | Mobile real       | Menu acessível, CRUD funciona                  | ☐      |
| MB07 | Editor visual      | Tablet            | Preview e edição funcionam                     | ☐      |
| MB08 | QR Code scan       | Câmera do celular | QR escaneia e abre cardápio correto            | ☐      |
| MB09 | WhatsApp link      | Mobile            | Link abre WhatsApp com mensagem formatada      | ☐      |
| MB10 | Scroll longo       | Mobile            | Scroll suave, sem travamento, sem layout shift | ☐      |

---

## 16. CHECKLIST FINAL DE APROVAÇÃO

### Contadores

| Categoria              | Total   | ✅  | ❌  | ⏭️  |
| ---------------------- | ------- | --- | --- | --- |
| Visitante Anônimo (V)  | 24      | \_  | \_  | \_  |
| Cliente Final (C)      | 26      | \_  | \_  | \_  |
| Dono do Delivery (D)   | 40      | \_  | \_  | \_  |
| Staff (S)              | 7       | \_  | \_  | \_  |
| Gerente (G)            | 7       | \_  | \_  | \_  |
| Afiliado (A)           | 15      | \_  | \_  | \_  |
| Revendedor (R)         | 6       | \_  | \_  | \_  |
| Suporte (SP)           | 10      | \_  | \_  | \_  |
| Administrador (AD)     | 19      | \_  | \_  | \_  |
| Owner (OW)             | 10      | \_  | \_  | \_  |
| Cross-Persona (X)      | 10      | \_  | \_  | \_  |
| Segurança (SEC)        | 12      | \_  | \_  | \_  |
| Performance & SEO (PF) | 10      | \_  | \_  | \_  |
| Mobile (MB)            | 10      | \_  | \_  | \_  |
| **TOTAL**              | **206** | \_  | \_  | \_  |

### Critérios de Aprovação

- 🟢 **Aprovado para produção:** 0 ❌ em SEC (segurança), 0 ❌ em X (cross-persona), ≤ 5 ❌ total
- 🟡 **Aprovado com ressalvas:** 0 ❌ em SEC, ≤ 10 ❌ total (documentar plano de correção)
- 🔴 **Reprovado:** Qualquer ❌ em SEC, ou > 10 ❌ total

### Assinatura

| Campo             | Valor                        |
| ----------------- | ---------------------------- |
| Data da auditoria | **_/_**/**\_\_**             |
| Auditor           | ******\_\_\_\_******         |
| Versão testada    | commit ****\_****            |
| Ambiente          | ☐ Local ☐ Staging ☐ Produção |
| Resultado         | ☐ 🟢 ☐ 🟡 ☐ 🔴               |
| Observações       |                              |

---

> **FIM DO E-BOOK DE AUDITORIA E2E**  
> Documento gerado em Abril 2026.  
> Nenhum código foi alterado na criação deste guia.
