# Personas & Testes de Validação para Produção

> Documento completo de todas as personas do sistema CardápioDigital SaaS  
> e os testes que cada persona deve executar para validar o software.

---

## Índice

1. [Resumo de Personas](#resumo-de-personas)
2. [Persona 1 — Visitante Anônimo](#persona-1--visitante-anônimo)
3. [Persona 2 — Cliente Final (Consumer)](#persona-2--cliente-final-consumer)
4. [Persona 3 — Dono do Delivery (Tenant)](#persona-3--dono-do-delivery-tenant)
5. [Persona 4 — Funcionário/Staff do Delivery](#persona-4--funcionáriostaff-do-delivery)
6. [Persona 5 — Gerente (Manager)](#persona-5--gerente-manager)
7. [Persona 6 — Afiliado](#persona-6--afiliado)
8. [Persona 7 — Revendedor](#persona-7--revendedor)
9. [Persona 8 — Suporte (Support)](#persona-8--suporte-support)
10. [Persona 9 — Administrador (Admin)](#persona-9--administrador-admin)
11. [Persona 10 — Owner (Dono da Plataforma)](#persona-10--owner-dono-da-plataforma)
12. [Matriz Persona × Tipo de Teste](#matriz-persona--tipo-de-teste)

---

## Resumo de Personas

| # | Persona | Nível de Acesso | Área Principal | Role Weight |
|---|---------|----------------|----------------|-------------|
| 1 | **Visitante Anônimo** | Público | Landing, catálogo, preços | — |
| 2 | **Cliente Final** | Público + QR Code | Cardápio, carrinho, pedido | — |
| 3 | **Dono do Delivery** | Autenticado (tenant) | `/painel/` | — |
| 4 | **Staff** | Autenticado (tenant) | `/painel/` (limitado) | — |
| 5 | **Gerente (Manager)** | Autenticado (tenant) | `/painel/` (expandido) | — |
| 6 | **Afiliado** | Autenticado | `/afiliados/`, `/painel/afiliados/` | — |
| 7 | **Revendedor** | Autenticado | `/revendedores/`, pacotes | — |
| 8 | **Suporte** | Admin | `/admin/suporte/` | 1 |
| 9 | **Administrador** | Admin | `/admin/` | 2 |
| 10 | **Owner** | Full | Tudo | 3 |

**Total: 10 personas**

---

## Persona 1 — Visitante Anônimo

**Quem é:** Qualquer pessoa que acessa o site pela primeira vez, sem cadastro, buscando conhecer a plataforma.

**Motivação:** Entender o que é o produto, ver preços, templates e decidir se vale a pena contratar.

### Testes de Validação

#### Testes Funcionais
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 1.1 | Acessar a homepage `/` | Página carrega em < 3s, sem erros visuais |
| 1.2 | Navegar pelo catálogo de templates `/templates` | Lista de templates carrega com imagens e preços |
| 1.3 | Visualizar preview de um template | Modal/página de preview abre com dados corretos |
| 1.4 | Acessar a página de preços `/precos` | Planos e valores exibidos corretamente |
| 1.5 | Acessar a página de ofertas `/ofertas` | Promoções ativas exibidas, datas válidas |
| 1.6 | Navegar para páginas legais (`/termos`, `/politica`, `/privacidade`, `/cookies`) | Conteúdo renderiza sem erros |
| 1.7 | Ver demo do cardápio `/demo` | Demo funcional sem necessidade de login |
| 1.8 | Clicar em "Cadastrar" / CTA | Redireciona para `/cadastro` ou `/auth` |
| 1.9 | Verificar footer e links de navegação | Todos os links funcionam, sem 404 |
| 1.10 | Acessar rota inexistente | Página 404 amigável |

#### Testes de SEO & Performance
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 1.11 | Verificar `robots.txt` (`/robots.txt`) | Arquivo serve corretamente, permite crawlers |
| 1.12 | Verificar `sitemap.xml` (`/sitemap.xml`) | Sitemap válido com URLs corretas |
| 1.13 | Lighthouse audit (Mobile) | Performance > 80, SEO > 90 |
| 1.14 | Open Graph / meta tags | Título, descrição e imagem social presentes |

#### Testes de UX/Responsividade
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 1.15 | Testar em mobile (375px) | Layout responsivo, sem overflow horizontal |
| 1.16 | Testar em tablet (768px) | Layout adapta corretamente |
| 1.17 | Testar em desktop (1440px) | Layout preenche espaço adequadamente |
| 1.18 | Banner de cookies aparece | O banner exibe e permite aceitar/rejeitar cookies |
| 1.19 | Tema claro/escuro | Alternância funciona sem quebras visuais |

#### Testes de Segurança
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 1.20 | Acessar `/admin` sem login | Redireciona para login / retorna 401 |
| 1.21 | Acessar `/painel` sem login | Redireciona para login |
| 1.22 | Injetar XSS na URL | Sanitizado, sem execução de script |

---

## Persona 2 — Cliente Final (Consumer)

**Quem é:** O consumidor que escaneia o QR Code de um delivery e faz um pedido pelo cardápio digital.

**Motivação:** Fazer um pedido rápido, ver o cardápio, montar pizza personalizada, acompanhar status.

### Testes de Validação

#### Testes Funcionais — Navegação no Cardápio
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 2.1 | Escanear QR Code e acessar cardápio do delivery | Cardápio do delivery correto carrega |
| 2.2 | Navegar entre categorias (pizzas, bebidas, etc.) | Filtro funciona, itens corretos por categoria |
| 2.3 | Visualizar detalhes de um produto | Nome, descrição, preço, imagem exibidos |
| 2.4 | Verificar preços formatados em BRL | Formato `R$ X,XX` correto |

#### Testes Funcionais — Pizza Builder
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 2.5 | Abrir o Pizza Builder | Interface carrega com tamanhos disponíveis |
| 2.6 | Selecionar tamanho (P, M, G) | Preço atualiza conforme tamanho |
| 2.7 | Selecionar borda (tradicional/recheada) | Preço do adicional somado corretamente |
| 2.8 | Adicionar sabores (½ a ½) | Cálculo do preço segue regra (maior valor) |
| 2.9 | Adicionar extras/adicionais | Valor total atualiza em tempo real |
| 2.10 | Finalizar montagem e adicionar ao carrinho | Item vai para o carrinho com todas as opções |

#### Testes Funcionais — Carrinho & Pedido
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 2.11 | Abrir o carrinho (drawer) | Exibe itens adicionados, quantidades, total |
| 2.12 | Alterar quantidade de item | Total recalcula corretamente |
| 2.13 | Remover item do carrinho | Item removido, total atualiza |
| 2.14 | Carrinho vazio | Mensagem amigável, botão para voltar ao cardápio |
| 2.15 | Preencher dados do pedido (nome, telefone, endereço) | Validação de campos obrigatórios |
| 2.16 | Enviar pedido | Pedido criado com número sequencial, status "pending" |
| 2.17 | Verificar snapshot de preços no pedido | Preços salvos no momento do pedido (não muda retroativo) |
| 2.18 | Gerar link WhatsApp com resumo | Mensagem formatada com itens, total, endereço |

#### Testes Funcionais — Acompanhamento
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 2.19 | Acessar `/status` com número do pedido | Status atual exibido (pending/confirmed/preparing/ready/delivered) |
| 2.20 | Status atualiza quando delivery muda etapa | Atualização reflete sem reload manual |
| 2.21 | Enviar feedback pós-entrega | Formulário de 1-4 estrelas funciona |

#### Testes de Chaos (Cliente Burro)
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 2.22 | Double-click no botão "Enviar Pedido" | Apenas 1 pedido criado (debounce) |
| 2.23 | Injetar XSS no campo nome | Sanitizado, sem execução |
| 2.24 | Injetar SQL no campo de busca | Sem erro SQL, retorno seguro |
| 2.25 | Enviar pedido com carrinho vazio (forçado via DevTools) | API rejeita com erro 400 |
| 2.26 | Alterar preço via DevTools | Server recalcula preço, ignora frontend |
| 2.27 | Submeter formulário com campos absurdos | Validação server-side rejeita |

---

## Persona 3 — Dono do Delivery (Tenant)

**Quem é:** O proprietário do delivery/pizzaria que contrata a plataforma para ter seu cardápio digital.

**Motivação:** Gerenciar cardápio, processar pedidos, acompanhar vendas, personalizar template.

### Testes de Validação

#### Testes de Autenticação & Onboarding
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 3.1 | Criar conta via `/cadastro` | Conta criada, e-mail de confirmação enviado |
| 3.2 | Login com e-mail e senha | Redireciona para `/painel` |
| 3.3 | Login com magic link | Link funcional, loga corretamente |
| 3.4 | Completar onboarding `/onboarding` | Dados do delivery salvos, tenant criado |
| 3.5 | Verificar status do onboarding `/onboarding/status` | Status correto (pendente/completo) |

#### Testes do Painel — Produtos & Categorias
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 3.6 | Acessar `/painel/categorias` | Lista categorias existentes |
| 3.7 | Criar nova categoria | Categoria salva, aparece na lista |
| 3.8 | Editar categoria | Alterações persistem |
| 3.9 | Excluir categoria com produtos | Aviso de dependência ou cascade |
| 3.10 | Acessar `/painel/produtos` | Lista todos os produtos |
| 3.11 | Criar novo produto (nome, preço, imagem, categoria) | Produto salvo com upload de imagem |
| 3.12 | Criar produto com tamanhos (P, M, G) | Variantes de tamanho salvas com preços |
| 3.13 | Adicionar bordas a produto pizza | Opções de borda salvas |
| 3.14 | Adicionar sabores | Sabores salvos com preços individuais |
| 3.15 | Criar adicionais (add-ons) | Add-ons vinculados ao produto |
| 3.16 | Editar produto existente | Alterações refletem no cardápio público |
| 3.17 | Desativar produto | Produto some do cardápio mas mantém no banco |
| 3.18 | Upload de imagem do produto | Upload para R2/Cloudflare funciona, URL retornada |

#### Testes do Painel — Pedidos
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 3.19 | Acessar `/painel/pedidos` | Lista pedidos recentes |
| 3.20 | Receber novo pedido (realtime) | Notificação sonora/visual, pedido aparece |
| 3.21 | Mudar status: pending → confirmed | Status atualiza, cliente vê mudança |
| 3.22 | Mudar status: confirmed → preparing | Transição correta |
| 3.23 | Mudar status: preparing → ready | Transição correta |
| 3.24 | Mudar status: ready → delivered | Pedido finalizado |
| 3.25 | Tentar pular etapa de status | Sistema impede (validação de fluxo) |

#### Testes do Painel — Template & Editor
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 3.26 | Acessar `/painel/editor` | Editor visual carrega com template atual |
| 3.27 | Alterar cores, fontes, logo | Preview atualiza em tempo real |
| 3.28 | Salvar alterações do template | Persiste, cardápio público reflete mudanças |
| 3.29 | Visualizar meus templates `/meus-templates` | Templates comprados/ativos listados |

#### Testes do Painel — Configurações
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 3.30 | Acessar `/painel/configuracoes` | Formulário com dados do delivery |
| 3.31 | Alterar nome, endereço, telefone | Dados atualizados |
| 3.32 | Configurar horário de funcionamento | Horários salvos |
| 3.33 | Gerar/baixar QR Code `/painel/qrcode` | QR Code gerado apontando para cardápio correto |

#### Testes do Painel — Planos & Assinatura
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 3.34 | Ver plano atual `/painel/planos` | Plano ativo exibido (free/pro/premium) |
| 3.35 | Fazer upgrade de plano | Redireciona para checkout MercadoPago |
| 3.36 | Trial expirar | Funcionalidades limitadas, prompt de upgrade |

#### Testes do Painel — Feedbacks
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 3.37 | Ver feedbacks dos clientes `/painel/feedbacks` | Lista com estrelas, comentários, sentimento IA |
| 3.38 | Filtrar feedbacks por data/rating | Filtro funciona corretamente |

#### Testes de Compra de Template
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 3.39 | Navegar para `/comprar/{template}` | Página de compra com preview e preço |
| 3.40 | Aplicar cupom de desconto | Preço recalculado, validação server-side |
| 3.41 | Finalizar compra via MercadoPago | Pagamento processado, template ativado |
| 3.42 | Webhook de confirmação do MercadoPago | Template provisionado automaticamente |

#### Testes de Isolamento Multi-Tenant
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 3.43 | Tenant A não vê dados do Tenant B | RLS impede acesso cruzado |
| 3.44 | Acessar produto de outro tenant via API | Retorna 403/404 |
| 3.45 | Manipular tenant_id no request | Server ignora, usa tenant do token |

---

## Persona 4 — Funcionário/Staff do Delivery

**Quem é:** Funcionário operacional do delivery que recebe pedidos e atualiza status.

**Motivação:** Processar pedidos rapidamente, ver o que precisa ser preparado.

### Testes de Validação

| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 4.1 | Login staff com permissões limitadas | Acesso apenas a funcionalidades autorizadas |
| 4.2 | Ver fila de pedidos | Pedidos do seu delivery apenas |
| 4.3 | Atualizar status de pedido | Funciona dentro das permissões |
| 4.4 | Tentar acessar configurações/produtos | Acesso negado se não autorizado |
| 4.5 | Tentar acessar financeiro/planos | Acesso negado |
| 4.6 | Ver detalhes de um pedido | Itens, endereço, telefone do cliente exibidos |
| 4.7 | Operar em mobile (cozinha) | Interface usável em tela pequena |

---

## Persona 5 — Gerente (Manager)

**Quem é:** Gerente do delivery com acesso mais amplo que staff, mas sem ser o dono.

**Motivação:** Gerenciar cardápio, funcionários e relatórios, sem acesso a billing.

### Testes de Validação

| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 5.1 | Login como manager | Acesso ao painel com permissões expandidas |
| 5.2 | Gerenciar produtos e categorias | CRUD completo funciona |
| 5.3 | Ver e gerenciar pedidos | Acesso total ao fluxo de pedidos |
| 5.4 | Ver feedbacks | Visualização permitida |
| 5.5 | Acessar page de planos/billing | Acesso restrito (somente owner) |
| 5.6 | Convidar novo staff (se disponível) | Funcionalidade de team management |
| 5.7 | Alterar configurações do delivery | Permitido ou parcialmente restrito |

---

## Persona 6 — Afiliado

**Quem é:** Parceiro que indica deliverys para a plataforma e recebe comissão (30%) sobre vendas.

**Motivação:** Gerar links de referral, acompanhar indicações e comissões, solicitar saques.

### Testes de Validação

#### Testes de Registro & Acesso
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 6.1 | Registrar como afiliado `/afiliados/registrar` | Cadastro criado, status "pending" |
| 6.2 | Aprovação do afiliado (pelo admin) | Status muda para "active" |
| 6.3 | Acessar dashboard do afiliado | Métricas carregam (indicações, saldo, comissões) |

#### Testes de Referral
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 6.4 | Gerar link de referral | URL com código único gerada |
| 6.5 | Link de referral redireciona corretamente | Acessar `/r/{código}` → landing com tracking |
| 6.6 | Tenant se cadastra via link de referral | Indicação registrada em `affiliate_referrals` |
| 6.7 | Comissão creditada quando tenant compra | Valor de 30% registrado no saldo |
| 6.8 | Ver ranking de afiliados `/afiliados/ranking` | Ranking exibido com posição correta |

#### Testes de Saldo & Payout
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 6.9 | Ver saldo detalhado `/afiliados/saldo-info` | Saldo total, pendente e disponível corretos |
| 6.10 | Solicitar saque (PIX) | Solicitação criada, dados PIX validados |
| 6.11 | Saque processado pelo admin | Valor debitado do saldo, comprovante registrado |
| 6.12 | Tentar sacar mais do que o saldo | Erro com mensagem clara |

#### Testes de Penalidade & Tiers
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 6.13 | Afiliado recebe strike (penalidade) | Penalidade registrada em `affiliate_penalties` |
| 6.14 | Acumular 3 strikes | Afiliado suspenso automaticamente |
| 6.15 | Atingir milestone de tier | Bônus ou upgrade de tier aplicado |
| 6.16 | Chat de afiliados `/api/chat/afiliados` | Funcionalidade de chat operacional |

#### Testes de Segurança do Afiliado
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 6.17 | Afiliado A não vê dados de Afiliado B | RLS isola dados |
| 6.18 | Afiliado tentar manipular comissão via API | Server rejeita, cálculo server-side |
| 6.19 | Referral com código inválido | Página 404 ou redireciona para landing sem tracking |

---

## Persona 7 — Revendedor

**Quem é:** Parceiro que compra pacotes de templates em bulk para revender a deliverys locais.

**Motivação:** Comprar pacotes com desconto e revender com margem, atender deliverys presencialmente.

### Testes de Validação

| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 7.1 | Acessar `/revendedores` | Página de informações/credencial do revendedor |
| 7.2 | Ver pacotes disponíveis para revenda | Lista de pacotes com preço bulk |
| 7.3 | Comprar pacote `/finalizar-compra-pacote` | Checkout funciona, pacote provisionado |
| 7.4 | Ativar template para um delivery | Template atribuído ao tenant corretamente |
| 7.5 | Ver histórico de pacotes comprados | Lista com status de cada item |
| 7.6 | Ver quantidade restante de licenças no pacote | Contador decrementado corretamente |
| 7.7 | Tentar ativar mais do que comprou | Erro informando limite atingido |
| 7.8 | Verificar webhook de pagamento | Provisioning automático pós-pagamento |

---

## Persona 8 — Suporte (Support)

**Quem é:** Agente de suporte da plataforma que atende tickets de tenants e clientes.

**Motivação:** Resolver tickets dentro do SLA (30 min first response), escalar quando necessário.

### Testes de Validação

| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 8.1 | Login como support (role weight=1) | Acesso ao painel admin com permissões limitadas |
| 8.2 | Ver fila de tickets `/admin/suporte` | Tickets listados por prioridade/SLA |
| 8.3 | Abrir e responder ticket | Mensagem salva em `support_messages` |
| 8.4 | SLA timer visível | Tempo restante para first response exibido |
| 8.5 | Ticket violando SLA | Alerta gerado em `system_alerts` |
| 8.6 | Escalar ticket para admin | Ticket atribuído a nível superior |
| 8.7 | Fechar ticket resolvido | Status "closed", timestamp registrado |
| 8.8 | Tentar acessar `/admin/financeiro` | Acesso negado (peso 1 < peso 2 necessário) |
| 8.9 | Tentar acessar `/admin/usuarios` | Acesso negado |
| 8.10 | Ver logs de audit do ticket | Histórico de ações visível |

---

## Persona 9 — Administrador (Admin)

**Quem é:** Gestor da plataforma com acesso amplo ao painel admin.

**Motivação:** Gerenciar tenants, afiliados, financeiro e métricas.

### Testes de Validação

#### Testes de Acesso & Dashboard
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 9.1 | Login como admin (role weight=2) | Dashboard admin carrega com métricas |
| 9.2 | Ver métricas gerais `/admin/metrics` | MRR, churn, novos tenants, pedidos totais |
| 9.3 | Ver alertas do sistema `/admin/alertas` | Alertas ativos listados |
| 9.4 | Ver logs de auditoria `/admin/logs` | Ações registradas em `system_logs` |

#### Testes de Gestão de Clientes
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 9.5 | Listar clientes (tenants) `/admin/clientes` | Lista paginada com busca/filtro |
| 9.6 | Ver detalhes do cliente `/admin/clientes/[id]` | Dados completos, plano, histórico |
| 9.7 | Gerenciar trials `/admin/trials` | Listar trials ativos, expirar manualmente |

#### Testes de Gestão de Afiliados
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 9.8 | Listar afiliados `/admin/afiliados` | Lista com status, comissões, ranking |
| 9.9 | Aprovar/rejeitar afiliado pending | Status atualiza, notificação enviada |
| 9.10 | Aplicar penalidade (strike) a afiliado | Strike registrado, afiliado notificado |
| 9.11 | Ver ranking de afiliados | Ranking por comissões correto |

#### Testes Financeiros
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 9.12 | Ver financeiro `/admin/financeiro` | Ledger com transações, payouts |
| 9.13 | Processar payout de afiliado | Pagamento registrado, saldo debitado |
| 9.14 | Ver histórico de webhooks | Eventos MercadoPago listados |
| 9.15 | Venda direta `/admin/venda-direta` | Criar venda manual para tenant sem checkout online |

#### Testes de Suporte Admin
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 9.16 | Ver tickets de suporte | Todos os tickets visíveis |
| 9.17 | Reatribuir ticket para outro agente | Ticket atualizado |
| 9.18 | Ver feedbacks de clientes `/admin/feedbacks` | Feedbacks com análise de sentimento |

#### Testes de Equipe
| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 9.19 | Gerenciar usuários admin `/admin/usuarios` | CRUD de admin_users |
| 9.20 | Criar support user (weight=1) | Usuário criado com permissões corretas |
| 9.21 | Tentar criar owner (weight=3) | Negado (admin não pode criar role acima do seu) |

---

## Persona 10 — Owner (Dono da Plataforma)

**Quem é:** O proprietário máximo da plataforma com acesso irrestrito.

**Motivação:** Visão total do sistema, configurações críticas, gestão de admins.

### Testes de Validação

| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 10.1 | Login como owner (role weight=3) | Acesso total a todas as áreas |
| 10.2 | Criar/gerenciar administradores | CRUD de admin_users com qualquer role |
| 10.3 | Acessar todas as áreas do admin | Nenhuma restrição de acesso |
| 10.4 | Ver cardápios de qualquer tenant `/admin/cardapios` | Acesso cross-tenant para suporte |
| 10.5 | Executar ações destrutivas (com confirmação) | Double confirmation dialog |
| 10.6 | Ver todos os logs de audit | Logs completos sem filtro de role |
| 10.7 | Configurar crons e webhooks | Acesso a configurações de sistema |
| 10.8 | Auth via header `Authorization: Bearer {KEY}` | Funciona para crons/CI |

---

## Matriz Persona × Tipo de Teste

### Tipos de Teste Aplicáveis

| Tipo de Teste | Descrição | Quais Personas |
|---------------|-----------|----------------|
| **Funcional** | Verificar se cada feature funciona como especificado | Todas (1-10) |
| **E2E (End-to-End)** | Fluxos completos de ponta a ponta | 2, 3, 6, 7 |
| **Unitário** | Funções isoladas (cálculos, validações) | — (dev) |
| **Integração** | APIs, webhooks, banco de dados | 3, 6, 7, 9 |
| **Responsividade** | Mobile, tablet, desktop | 1, 2, 4 |
| **Performance** | Tempo de carregamento, Lighthouse | 1, 2, 3 |
| **Segurança** | XSS, SQL injection, IDOR, broken access | 1, 2, 3, 6, 9, 10 |
| **Caos (Chaos)** | Double-click, inputs absurdos, manipulação DOM | 2, 3, 6 |
| **Multi-Tenant Isolation** | Dados isolados entre tenants | 3, 4, 5 |
| **Permissão/RBAC** | Role-based access control | 4, 5, 8, 9, 10 |
| **Pagamento** | Checkout, webhook, provisioning | 3, 6, 7 |
| **SLA** | Tempo de resposta de suporte | 8, 9 |
| **Regressão** | Funcionalidades antigas não quebraram | Todas |
| **Acessibilidade (a11y)** | Screen reader, contraste, teclado | 1, 2 |
| **SEO** | Meta tags, sitemap, robots, structured data | 1 |
| **Offline/Rede lenta** | Comportamento sem internet | 2, 4 |
| **Webhook** | MercadoPago, Supabase triggers | 3, 7, 9 |
| **Cron Jobs** | Trial expiration, payout, health | 9, 10 |
| **Audit Trail** | Logs de ação registrados corretamente | 8, 9, 10 |

### Resumo Numérico

| Persona | Testes Funcionais | Testes Segurança | Testes E2E | Total Aproximado |
|---------|-------------------|------------------|------------|------------------|
| 1 — Visitante | 10 | 3 | 0 | 22 |
| 2 — Cliente Final | 15 | 6 | 3 | 27 |
| 3 — Dono Delivery | 30 | 3 | 5 | 45 |
| 4 — Staff | 7 | 0 | 1 | 7 |
| 5 — Manager | 7 | 0 | 1 | 7 |
| 6 — Afiliado | 16 | 3 | 3 | 19 |
| 7 — Revendedor | 8 | 0 | 2 | 8 |
| 8 — Suporte | 10 | 0 | 1 | 10 |
| 9 — Admin | 21 | 0 | 3 | 21 |
| 10 — Owner | 8 | 0 | 1 | 8 |
| **TOTAL** | **132** | **15** | **20** | **~174** |

---

## Comandos de Teste Existentes

```bash
# Testes unitários
npm test

# E2E completo (Playwright)
npm run test:e2e

# E2E — Happy path checkout
npm run test:e2e:checkout

# E2E — Chaos testing (cliente burro)
npm run test:e2e:chaos

# Auditoria completa (build + lint + unit)
npm run audit:full

# Teste fluxo de afiliados
npm run test:affiliate

# Teste webhooks MercadoPago
npm run test:webhook
```

---

## Prioridade de Execução para Go-Live

### P0 — Bloqueantes (executar antes de ir para produção)
1. Testes de pagamento (checkout, webhook, provisioning)
2. Testes de segurança (XSS, SQL injection, IDOR, RBAC)
3. Testes de multi-tenant isolation
4. Fluxo completo do cliente (QR → pedido → status)
5. Fluxo completo do tenant (cadastro → onboarding → cardápio → pedido)

### P1 — Críticos (executar na primeira semana)
1. Fluxo de afiliados (referral → comissão → payout)
2. SLA de suporte (30 min first response)
3. Cron jobs (trial, payout, health)
4. Performance mobile (Lighthouse > 80)

### P2 — Importantes (executar no primeiro mês)
1. Fluxo de revendedores
2. Testes de acessibilidade
3. Testes offline/rede lenta
4. SEO completo
