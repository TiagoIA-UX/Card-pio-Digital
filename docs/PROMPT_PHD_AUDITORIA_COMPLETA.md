# PROMPT PhD — AUDITORIA COMPLETA DA PLATAFORMA CARDÁPIO DIGITAL (ZAIRYX)

> **Versão:** 1.0 — 17 mar 2026
> **Uso:** Copiar integralmente e colar em um agente de IA (Claude, GPT-4, Copilot)
> para obter uma auditoria exaustiva do repositório.
> **Repositório:** `TiagoIA-UX/Card-pio-Digital` · branch `rename/cardapio-digital`

---

## CONTEXTO DO SISTEMA

| Item                      | Valor                                                        |
| ------------------------- | ------------------------------------------------------------ |
| **Domínio**               | zairyx.com (www redireciona para apex)                       |
| **Stack**                 | Next.js 14 App Router · React 18 · TypeScript · Tailwind CSS |
| **Backend**               | Supabase (Auth SSR + Postgres + RLS + Edge Functions)        |
| **Pagamentos**            | Mercado Pago (preferências + webhooks + assinaturas)         |
| **Storage**               | Cloudflare R2 (imagens de cardápio)                          |
| **IA**                    | Groq (chat de vendas Cadu + mentor de afiliados Prof. Nilo)  |
| **Rate Limit**            | Upstash Redis (produção) / in-memory (dev)                   |
| **Deploy**                | Vercel (crons, middleware, edge)                             |
| **Planos**                | Start R$79/mês · Pro R$129/mês · Elite R$199/mês             |
| **Modelo comercial**      | SaaS B2B — venda de cardápio digital para restaurantes       |
| **Programa de afiliados** | Tiers trainee → profissional → expert → sócio (30-35%)       |

---

## METODOLOGIA OBRIGATÓRIA

Ao auditar cada seção, classifique **todo achado** em uma destas categorias:

| Categoria              | Significado                                                   | Exigência                                          |
| ---------------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **✅ CONFIRMADO**      | Evidência encontrada no código-fonte                          | Cite o arquivo e a linha exata                     |
| **⚠️ HIPÓTESE**        | Comportamento provável mas não verificável apenas pelo código | Explique o raciocínio e o que falta para confirmar |
| **❌ NÃO VERIFICÁVEL** | Depende de ambiente, dados em produção ou serviço externo     | Indique o que seria necessário para verificar      |

### Regras adicionais

1. **Nunca invente achado.** Se não encontrou evidência, diga claramente.
2. **Sempre cite o caminho relativo do arquivo e o número da linha** ao apontar um problema.
   Formato: `arquivo.ts:L42` ou `arquivo.ts:L42-L58`.
3. **Ao apontar risco jurídico, cite o trecho exato do código ou texto** que gera o risco,
   entre aspas, seguido do arquivo e linha.
4. **Separe "o que o código faz" de "o que o código deveria fazer".**
5. **Não sugira melhorias cosméticas.** Foque em: segurança, conformidade, correção funcional
   e experiência crítica do usuário final.

---

## SEÇÕES DE AUDITORIA

---

### 1. ARQUITETURA E ENGENHARIA

Verifique:

**ESTRUTURA**

- A organização de pastas segue convenções do Next.js App Router?
- Existe separação clara entre: pages (app/), componentes, lib, hooks, services, types?
- Há código morto, duplicado ou módulos não utilizados?
- As rotas de API seguem padrão RESTful consistente?

**DEPENDÊNCIAS**

- Existem dependências com vulnerabilidades conhecidas? (`npm audit`)
- Há dependências duplicadas ou conflitantes em package.json?
- As versões de dependências críticas (Next.js, Supabase, React) estão atualizadas?

**BUILD E DEPLOY**

- O build de produção passa sem erros? (`npm run build`)
- Existe `ignoreBuildErrors: true` ou `ignoreDuringBuilds: true` em next.config?
- Os crons em vercel.json estão configurados corretamente?
- Existem rotas de API ou páginas que nunca são acessadas?

**TIPAGEM**

- Há uso excessivo de `any`, `as any`, ou type assertions inseguras?
- Os tipos de retorno das APIs estão definidos?
- Existem interfaces/types duplicados entre arquivos?

---

### 2. SEGURANÇA TÉCNICA (OWASP TOP 10)

Verifique cada item do OWASP Top 10 aplicado ao contexto:

**A01 — BROKEN ACCESS CONTROL**

- Todas as rotas protegidas verificam autenticação antes de processar?
- As rotas de admin usam o `requireAdmin` centralizado (`lib/admin-auth.ts`)?
- Existe verificação de ownership (ex: restaurante pertence ao usuário)?
- O middleware protege todas as rotas que deveriam ser protegidas?

**A02 — CRYPTOGRAPHIC FAILURES**

- Secrets estão em variáveis de ambiente (nunca hardcoded)?
- As chaves do Supabase (anon vs service-role) são usadas nos contextos corretos?
- Tokens JWT são validados corretamente?

**A03 — INJECTION**

- Existe SQL raw sem parametrização?
- Inputs de usuário são sanitizados antes de uso em queries Supabase?
- Existe risco de XSS em renderização dinâmica (dangerouslySetInnerHTML)?
- Uploads validam conteúdo real (magic bytes) ou confiam no Content-Type?

**A04 — INSECURE DESIGN**

- Rate limiting está implementado em todas as rotas públicas críticas?
- Webhooks validam assinatura antes de processar?
- Existe proteção contra enumeração de recursos (IDs sequenciais)?

**A05 — SECURITY MISCONFIGURATION**

- Headers de segurança estão configurados (CORS, CSP, HSTS)?
- `vercel.json` tem configuração de CORS válida?
- Existem endpoints de debug ou desenvolvimento expostos em produção?

**A06 — VULNERABLE COMPONENTS**

- Dependências com CVEs conhecidos?

**A07 — IDENTIFICATION AND AUTHENTICATION FAILURES**

- Login por email/senha e OAuth (Google) funcionam corretamente?
- Sessions expiram adequadamente?
- Existe brute-force protection no login?

**A08 — SOFTWARE AND DATA INTEGRITY FAILURES**

- Webhooks do Mercado Pago validam assinatura HMAC obrigatoriamente?
- Existe idempotência nos handlers de webhook?

**A09 — LOGGING AND MONITORING**

- Eventos críticos (pagamento, auth, admin) são logados?
- Logs são estruturados (JSON) para facilitar busca?

**A10 — SSRF**

- Existe fetch/request a URLs fornecidas pelo usuário sem validação?

---

### 3. PRIVACIDADE E DADOS

Verifique:

**COLETA**

- Quais dados pessoais são coletados (nome, email, telefone, endereço, CPF)?
- A coleta é mínima (apenas o necessário para o serviço)?
- O consentimento é obtido antes de gravar cookies não-essenciais?
- O cookie banner grava HTTP cookie legível pelo servidor?

**ARMAZENAMENTO**

- Dados sensíveis estão criptografados em repouso (Supabase)?
- RLS está ativo em todas as tabelas que contêm dados de usuários?
- Backups automáticos estão configurados no Supabase?

**COMPARTILHAMENTO**

- Dados são enviados para serviços terceiros (analytics, Mercado Pago)?
- O envio respeita o consentimento do usuário?
- Analytics (Vercel) e SpeedInsights só carregam após consentimento?

**EXCLUSÃO**

- Existe mecanismo para o usuário solicitar exclusão de dados (LGPD Art. 18)?
- O fluxo de cancelamento de conta remove dados pessoais?

---

### 4. JURÍDICO E REGULATÓRIO

Verifique cada legislação aplicável:

**4.1 — LGPD (Lei 13.709/2018)**

- Existe Política de Privacidade acessível? Está completa conforme Arts. 7-10?
- A base legal para cada tratamento está identificada?
- Existe canal para exercício de direitos do titular (Art. 18)?
- Cookies não-essenciais só são gravados após consentimento explícito?
- O consentimento é granular (aceitar/rejeitar)?

**4.2 — CDC (Código de Defesa do Consumidor)**

- Preços exibidos são claros e finais (sem valores ocultos)?
- Existe direito de arrependimento (Art. 49) para compras online?
- As condições de cancelamento e reembolso estão visíveis?
- Promessas de marketing correspondem ao que o software entrega?

**4.3 — Marco Civil da Internet (Lei 12.965/2014)**

- Termos de Uso existem e são acessíveis?
- A plataforma armazena logs de acesso conforme Art. 15?
- Existe procedimento para remoção de conteúdo mediante ordem judicial?

**4.4 — PROGRAMA DE AFILIADOS**

- Os Termos do Programa de Afiliados existem e cobrem:
  - Regras de comissionamento (percentuais por tier)?
  - Vedação de spam e práticas abusivas?
  - Condições de pagamento (prazo, valor mínimo, forma)?
  - Cláusula de rescisão e estorno?
- Os percentuais no código (`commission_rate`) conferem com os termos?
- O fluxo de pagamento FIFO está auditável?
- A validação de chave PIX é robusta?

**4.5 — TEXTOS JURÍDICOS**

- Política de Privacidade (`/privacidade` ou `/politica-de-privacidade`)
- Termos de Uso (`/termos` ou `/termos-de-uso`)
- Política de Cookies (`/cookies`)
- Todos existem, são acessíveis e linkados no footer e no cookie banner?
- Os textos refletem as funcionalidades reais do sistema?

> **REGRA:** Ao apontar risco jurídico, cite o trecho exato do código
> ou texto público entre aspas, seguido de arquivo:linha.

---

### 5. FLUXOS CRÍTICOS

Simule manualmente cada fluxo e verifique ponta a ponta:

**5.1 — COMPRA DE PLANO**

- Usuário escolhe plano → checkout → Mercado Pago → webhook → ativação
- O plano correto é associado ao restaurante após pagamento?
- O que acontece se o webhook falhar ou demorar?
- Existe retry/reprocessamento?
- Idempotência: pagamento duplicado gera ativação dupla?

**5.2 — CADASTRO E ONBOARDING**

- Cadastro (email/Google) → criação de restaurante → primeiro cardápio
- O onboarding guia o usuário corretamente?
- O que acontece se o usuário abandonar no meio?
- Dados parciais ficam órfãos no banco?

**5.3 — EDIÇÃO DE CARDÁPIO**

- Adicionar/editar/remover categorias e produtos
- Upload de imagem → visualização → salvar
- As alterações persistem corretamente?
- O cardápio público reflete as alterações em tempo real?

**5.4 — PEDIDO VIA WHATSAPP**

- Cliente escaneia QR / abre link → navega cardápio → monta pedido → envia WhatsApp
- O número correto do restaurante é usado?
- A mensagem inclui todos os itens e valores corretos?
- O que acontece se o restaurante não tiver WhatsApp configurado?

**5.5 — REGISTRO DE AFILIADO**

- Cadastro → geração de link → indicação → comissão → pagamento
- O cookie `aff_ref` é gravado corretamente (com consentimento)?
- A atribuição sobrevive ao login/cadastro do indicado?
- O tier é recalculado após cada indicação?

---

### 6. CHAT E IA

Verifique os dois agentes de IA:

**6.1 — CADU (VENDAS)**

- O fluxo conversacional é determinístico ou randômico?
- Existe fallback genérico que quebra a experiência?
- O Cadu menciona preços corretos (Start R$79, Pro R$129, Elite R$199)?
- As respostas são coerentes com o produto real?
- Existe rate limit na rota de chat?

**6.2 — PROFESSOR NILO (MENTOR DE AFILIADOS)**

- O fluxo cobre: boas-vindas → como funciona → estratégias → dúvidas?
- Os percentuais de comissão mencionados estão corretos?
- Existe proteção contra prompt injection?
- O chat está restrito a afiliados autenticados?

**GERAL**

- API keys do Groq estão em env vars?
- Respostas da IA são sanitizadas antes de renderizar?
- Existe timeout para chamadas à API do Groq?

---

### 7. CONVERSÃO E NEGÓCIO

Verifique:

**FUNIL DE VENDAS**

- A landing page tem CTA claro e único?
- A página de preços apresenta os 3 planos de forma clara?
- Existe ancoragem de preço (plano mais caro primeiro ou destaque no recomendado)?
- O checkout tem o mínimo de fricção possível?
- Existe abandono de carrinho e re-engajamento?

**COPY E PROMESSAS**

- Os textos da landing page correspondem ao que o software faz?
- Existem promessas exageradas ou enganosas?
- Depoimentos são reais ou fabricados?
- Números citados (economia, aumento de vendas) têm base?

**MÉTRICAS**

- Existe tracking de conversão (com consentimento)?
- Os UTMs e referral codes são preservados ao longo do funil?
- O cookie de afiliado sobrevive até a conversão?

---

### 8. RESILIÊNCIA E PRODUÇÃO

Verifique:

**DISPONIBILIDADE**

- O que acontece se o Supabase ficar indisponível?
- O que acontece se o Mercado Pago ficar indisponível?
- O que acontece se o Groq (IA) ficar indisponível?
- O que acontece se o Cloudflare R2 ficar indisponível?
- Existe fallback ou mensagem de erro adequada em cada caso?

**ERROR HANDLING**

- Erros 500 são capturados e logados?
- O usuário vê mensagem amigável em caso de erro?
- Existe retry automático para operações idempotentes?
- Sentry ou equivalente está configurado?

**PERFORMANCE**

- Páginas públicas são estáticas ou SSR?
- Imagens usam `next/image` com otimização?
- Existe lazy loading para componentes pesados?
- Bundle size está dentro do razoável?

**CRONS**

- Quais crons existem em vercel.json?
- Cada cron tem handler implementado?
- Os crons são idempotentes (rodar 2x não causa problema)?

---

### 9. QR CODES E LINKS DE MESA

Verifique:

**GERAÇÃO**

- Os QR Codes estão sendo gerados com a URL correta por mesa?
- A lógica de geração associa corretamente mesa → restaurante → cardápio?
- Existe risco de colisão (duas mesas com o mesmo QR)?
- O QR Code aponta para ambiente de produção ou existe risco de
  apontar para preview/local?

**LINKS E ROTEAMENTO**

- O link do QR Code resolve corretamente em produção?
- Existe tratamento para QR Code de mesa inativa ou restaurante
  com plano cancelado?
- O que o cliente final vê se acessar um link de restaurante suspenso?
- Existe risco de link expirado sem aviso claro?

**FUNCIONALIDADE**

- O fluxo completo funciona: escanear → abrir cardápio → fazer
  pedido via WhatsApp?
- O número de WhatsApp do restaurante está sendo injetado
  corretamente no link?
- Existe risco de número de WhatsApp de um restaurante aparecer
  para cliente de outro?

**SEGURANÇA**

- O identificador da mesa na URL é previsível (sequencial)?
  Se sim, existe risco de enumeração?
- Existe validação de que o acesso ao cardápio pertence ao
  restaurante correto?

---

### 10. MULTI-TENANCY E ISOLAMENTO ENTRE RESTAURANTES

Verifique:

**ISOLAMENTO DE DADOS**

- RLS no Supabase garante que restaurante A não acessa dados de restaurante B?
- As policies RLS cobrem todas as tabelas com dados de restaurante?
- Existe alguma query com `service_role` que ignora RLS sem necessidade?
- O `anon` key é usado apenas no client-side?

**ISOLAMENTO DE FUNCIONALIDADE**

- O painel de um restaurante mostra apenas seus próprios dados?
- Produtos, categorias, pedidos e configurações são filtrados por `restaurant_id`?
- Um restaurante pode editar o cardápio de outro via manipulação de request?

**ISOLAMENTO DE ASSETS**

- Imagens no R2 são organizadas por restaurante?
- Um restaurante pode acessar/deletar imagens de outro?
- O upload valida ownership antes de gravar?

---

### 11. ONBOARDING DO RESTAURANTE

Verifique:

**FLUXO**

- Qual é a sequência de passos do onboarding?
- Todos os passos são necessários ou existe etapa dispensável?
- O que acontece se o restaurante pular uma etapa?
- Existe indicador de progresso?

**DADOS OBRIGATÓRIOS**

- Nome do restaurante, telefone WhatsApp, endereço — são obrigatórios?
- A validação de WhatsApp é robusta (formato, DDD)?
- Existe validação de CNPJ/CPF do restaurante?

**ATIVAÇÃO**

- O restaurante fica ativo imediatamente ou depende de pagamento?
- Existe período trial?
- O que aparece no cardápio público de um restaurante em onboarding incompleto?

---

### 12. CARDÁPIO DIGITAL — CRIAÇÃO E GESTÃO

Verifique:

**EDITOR**

- O editor de cardápio é intuitivo (arrastar categorias, editar inline)?
- É possível adicionar/remover/reordenar categorias livremente?
- Produtos suportam: nome, descrição, preço, imagem, variações/tamanhos?
- Existe preview em tempo real do cardápio enquanto edita?

**TEMPLATES**

- Quais templates existem (pizzaria, hamburgueria, restaurante, quiosque)?
- Cada template tem layout e cores próprias?
- O restaurante pode trocar de template depois de ativado?
- Templates são servidos por rotas dinâmicas ou estáticas?

**VALIDAÇÃO**

- Preço zero ou negativo é bloqueado?
- Produto sem nome é bloqueado?
- Imagem é obrigatória por produto?
- Existe limite de categorias ou produtos por plano?

---

### 13. FLUXO DE PEDIDO VIA WHATSAPP

Verifique:

**MONTAGEM DO PEDIDO**

- O cliente pode selecionar múltiplos itens com quantidades diferentes?
- Variações (tamanho P/M/G, sabores) funcionam corretamente?
- O resumo do pedido mostra itens, quantidades e subtotal?
- Existe campo para observações?

**ENVIO**

- O link `wa.me/<numero>?text=<mensagem>` é montado corretamente?
- A mensagem formatada é legível no WhatsApp?
- Caracteres especiais (acentos, emojis) são tratados?
- O número do restaurante é sempre o `+55` com DDD?

**EDGE CASES**

- Pedido vazio é bloqueado?
- Pedido com valor total R$0 é bloqueado?
- O que acontece se o restaurante desativou um produto que está no carrinho?
- O que acontece se o restaurante trocou de número de WhatsApp?

---

### 14. DASHBOARD DO RESTAURANTE

Verifique:

**VISÃO GERAL**

- O dashboard mostra métricas relevantes (pedidos, visualizações, receita)?
- Os dados são em tempo real ou cacheados?
- Existe gráfico ou apenas números?

**GESTÃO**

- O restaurante pode editar: dados do estabelecimento, cardápio, produtos?
- Existe gestão de horário de funcionamento?
- O restaurante pode pausar o cardápio (fora de horário)?

**CONFIGURAÇÕES**

- WhatsApp, endereço, logo, banner — são editáveis pelo painel?
- Existe preview de como o cardápio aparece para o cliente?
- O restaurante pode gerar/baixar QR Codes pelo painel?

---

### 15. UPGRADE, DOWNGRADE E CANCELAMENTO DE PLANO

Verifique:

**UPGRADE**

- O fluxo de upgrade preserva dados existentes?
- A cobrança é proporcional (pro rata) ou ciclo completo?
- Features do novo plano são liberadas imediatamente?

**DOWNGRADE**

- O que acontece com features do plano superior ao fazer downgrade?
- Dados que excedem limites do plano inferior são preservados ou removidos?
- O restaurante é avisado antes de perder funcionalidades?

**CANCELAMENTO**

- O fluxo de cancelamento existe e funciona?
- Existe pesquisa de saída (churn survey)?
- O cardápio público é desativado imediatamente ou no fim do ciclo?
- Dados são preservados por quanto tempo após cancelamento?
- A assinatura no Mercado Pago é cancelada corretamente?

---

### 16. E-MAILS TRANSACIONAIS

Verifique:

**EXISTÊNCIA**

- Quais e-mails transacionais existem?
  - Confirmação de cadastro
  - Confirmação de pagamento
  - Boas-vindas ao plano
  - Aviso de expiração
  - Recibo de comissão (afiliados)
  - Reset de senha
- Eles são enviados via Supabase Auth, API externa ou não existem?

**CONTEÚDO**

- Os e-mails contêm informações corretas (plano, valor, data)?
- Existe branding (logo, cores) ou é texto puro?
- Links nos e-mails apontam para produção (zairyx.com)?

**DELIVERABILITY**

- O domínio tem SPF, DKIM e DMARC configurados?
- Os e-mails caem em spam frequentemente?

---

### 17. ACESSIBILIDADE E COMPATIBILIDADE MOBILE

Verifique:

**ACESSIBILIDADE (WCAG 2.1 AA)**

- Contraste de cores atende ao mínimo (4.5:1 texto, 3:1 elementos grandes)?
- Navegação por teclado funciona em todas as ações críticas?
- Elementos interativos têm `aria-label` ou texto acessível?
- Imagens têm `alt` text descritivo?
- Formulários têm labels associados aos inputs?

**MOBILE**

- O cardápio público é responsivo e funcional em telas de 320px?
- O painel do restaurante funciona em mobile?
- Botões e links têm área de toque mínima (44x44px)?
- O checkout funciona bem em navegadores mobile (Chrome, Safari)?

**PERFORMANCE MOBILE**

- Lighthouse Performance score > 80 em mobile?
- LCP < 2.5s na landing page?
- CLS < 0.1?

---

### 18. PAINEL DE ADMIN INTERNO

Verifique:

**ACESSO**

- O painel admin (`/admin` ou equivalente) usa autenticação robusta?
- Existe separação de roles (support, admin, owner)?
- O `requireAdmin` centralizado (`lib/admin-auth.ts`) é usado em todas as rotas admin?
- Existe log de ações administrativas?

**FUNCIONALIDADES**

- O admin pode ver todos os restaurantes?
- O admin pode ver/gerenciar pagamentos?
- O admin pode gerenciar afiliados e comissões?
- O admin pode gerenciar o bonus fund?
- Existe busca/filtro no painel admin?

**SEGURANÇA**

- Ações destrutivas (deletar restaurante, revogar acesso) exigem confirmação?
- Existe audit trail de ações admin?
- O admin pode impersonar um restaurante sem deixar rastro?

---

## FORMATO OBRIGATÓRIO DO RELATÓRIO

O relatório final deve seguir esta estrutura:

### A. RESUMO EXECUTIVO

- Nota geral de saúde (0-10)
- Top 5 riscos mais graves (com classificação de severidade)
- Top 5 pontos positivos

### B. ACHADOS CRÍTICOS (Severidade Alta)

- Problemas que requerem correção imediata
- Cada achado com: descrição, arquivo:linha, impacto, correção sugerida

### C. ACHADOS IMPORTANTES (Severidade Média)

- Problemas que devem ser corrigidos em breve
- Mesmo formato da seção B

### D. ACHADOS MENORES (Severidade Baixa)

- Melhorias recomendadas mas não urgentes

### E. CONFORMIDADE JURÍDICA

- Tabela de cada legislação × status (conforme / não conforme / parcial)
- Citação exata dos trechos problemáticos

### F. MAPA DE FLUXOS VERIFICADOS

- Tabela de cada fluxo × status (funcional / parcial / quebrado / não testável)

### G. HIPÓTESES PENDENTES

- Lista de verificações que não puderam ser feitas apenas pelo código
- O que seria necessário para verificar cada uma

### H. PLANO DE REMEDIAÇÃO PRIORIZADO

- Sequência de correções ordenada por: severidade × esforço
- Para cada item: o que fazer, onde no código, estimativa de complexidade (P/M/G)

---

## REGRAS FINAIS

1. **Leia todo o repositório** antes de emitir qualquer achado.
2. **Não assuma que algo funciona** apenas porque o código parece correto.
   Verifique se o código é alcançável e se as condições de execução são realistas.
3. **Ao apontar risco jurídico**, cite o trecho exato do código ou texto público
   entre aspas, seguido de `arquivo:linha`. Exemplo:
   > "Seus dados podem ser compartilhados com parceiros" — `app/privacidade/page.tsx:L42`
4. **Não sugira refatorações estéticas.** A auditoria é sobre: funciona? é seguro?
   está conforme? O usuário final está protegido?
5. **Priorize achados por impacto real**, não por quantidade. Um único achado
   crítico vale mais que dez observações cosméticas.
6. **O relatório deve ser acionável.** Cada achado deve ter correção sugerida
   com localização exata no código.
7. **Mantenha o tom técnico e objetivo.** Sem linguagem alarmista ou eufemística.
