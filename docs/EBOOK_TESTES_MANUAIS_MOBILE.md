# Guia Completo de Testes Manuais — Mobile

**Plataforma:** Cardápio Digital (zairyx.com)
**Dispositivo:** Celular (iPhone/Android)
**Ambiente:** Sandbox Mercado Pago (dinheiro fake)
**Tempo estimado:** 30-40 minutos para todos os testes
**Pré-requisito:** Acesso à conta Google para login

> **SEGURANÇA:** Este documento NÃO contém credenciais reais.
> As credenciais de teste do Mercado Pago estão no `.env.local` do projeto (linhas 38-53).
> Nunca compartilhe este arquivo. Consulte o `.env.local` quando precisar dos valores.

---

## SUMÁRIO

1. [Preparação do ambiente](#1-preparação-do-ambiente)
2. [Teste 1: Compra com PIX (Self-Service)](#2-teste-1-compra-com-pix-self-service)
3. [Teste 2: Compra com Cartão (Feito Pra Você)](#3-teste-2-compra-com-cartão-feito-pra-você)
4. [Teste 3: Pagamento recusado](#4-teste-3-pagamento-recusado)
5. [Teste 4: Pagamento pendente (PIX timeout)](#5-teste-4-pagamento-pendente)
6. [Teste 5: Cupom de desconto](#6-teste-5-cupom-de-desconto)
7. [Teste 6: Validações de formulário](#7-teste-6-validações-de-formulário)
8. [Teste 7: Painel do restaurante](#8-teste-7-painel-do-restaurante)
9. [Teste 8: Cadastro de afiliado](#9-teste-8-cadastro-de-afiliado)
10. [Teste 9: Onboarding (Feito Pra Você)](#10-teste-9-onboarding-feito-pra-você)
11. [Teste 10: Segurança e chaos](#11-teste-10-segurança-e-chaos)
12. [Teste 11: Navegação geral mobile](#12-teste-11-navegação-geral-mobile)
13. [Checklist final](#13-checklist-final)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Preparação do ambiente

### 1.1 Trocar para modo SANDBOX

**IMPORTANTE:** Antes de testar, o `.env.local` precisa estar em modo sandbox.

No arquivo `.env.local`, as linhas 30-31 devem estar assim:

```
MERCADO_PAGO_ENV=sandbox
NEXT_PUBLIC_MERCADO_PAGO_ENV=sandbox
```

Se estiverem como `production`, troque para `sandbox` e reinicie o servidor (`npm run dev`).

Para testes na Vercel (preview URL), configure as mesmas variáveis no dashboard da Vercel.

### 1.2 Credenciais de teste do Mercado Pago

As credenciais estão no `.env.local` (linhas 38-53). Resumo do que você vai precisar:

**Contas de teste:**

| Papel | Localização no .env.local | Uso |
|-------|--------------------------|-----|
| Comprador | Linha 43-44 (TESTUSER + senha) | Login no checkout MP |
| Vendedor | Linha 45 (TESTUSER + senha) | Recebe o pagamento |

**Cartões de teste:**

| Bandeira | Localização | CVV | Validade |
|----------|-------------|-----|----------|
| Mastercard | .env.local linha 47 | 123 | 11/30 |
| Visa | .env.local linha 48 | 123 | 11/30 |
| Amex | .env.local linha 49 | 1234 | 11/30 |
| Elo Débito | .env.local linha 50 | 123 | 11/30 |

**Nomes mágicos do titular** (controlam o resultado):

| Nome no campo titular | Resultado |
|-----------------------|-----------|
| APRO | Pagamento **aprovado** |
| OTHE | Erro genérico |
| CONT | Pagamento **pendente** |
| FUND | Saldo insuficiente |
| SECU | CVV inválido |
| EXPI | Cartão vencido |
| FORM | Erro no formulário |

**CPF de teste:** `12345678909` (usar em todos os testes)

### 1.3 Abrir o site no celular

**Opção A — Servidor local:**
1. No PC, rode `npm run dev`
2. No celular, acesse `http://[IP-DO-PC]:3000`
   - Descubra o IP: `ipconfig` no terminal → IPv4 Address
   - Ex: `http://192.168.1.10:3000`

**Opção B — Preview Vercel (recomendado):**
1. Faça push do código com env sandbox
2. Acesse a preview URL que Vercel gera
3. Ex: `https://cardapio-digital-xxxx.vercel.app`

**Opção C — Produção:**
1. `https://zairyx.com`
2. APENAS se o env estiver em sandbox na Vercel

---

## 2. Teste 1: Compra com PIX (Self-Service)

**Objetivo:** Validar o fluxo completo de compra com PIX, do início ao painel.

### Passo a passo no celular

```
1. Abra no navegador: /templates
   → Esperado: Lista de templates com cards clicáveis

2. Toque no card "Pizzaria"
   → Esperado: Página de preview com botão de compra

3. Toque em "Começar" ou "Comprar"
   → Redirect para: /comprar/pizzaria

4. Na página de checkout:
   - Selecione o plano "Self-Service" (R$ 247 PIX)
   - Preencha:
     • Nome do negócio: "Pizzaria Teste Manual"
     • Seu nome: "APRO" (nome mágico para aprovar)
     • Email: seu email real (vai receber notificação)
     • WhatsApp: 12999887766
   - Selecione "PIX" como forma de pagamento

5. Toque em "Proceder para pagamento"
   → Redirect para: Mercado Pago (checkout externo)

6. No Mercado Pago:
   - Se pedir login: use a conta COMPRADOR do .env.local
   - Selecione PIX
   - Copie o código PIX (ou escaneie QR — sandbox)
   - "Pague" o PIX no sandbox

7. Após pagamento:
   → Redirect para: /pagamento/sucesso
   → Esperado: tela verde com confete, "Parabéns!"

8. Verificações:
   ✓ Confete aparece por ~5 segundos
   ✓ Resumo do pedido visível (template, plano, valor)
   ✓ Botão "Ir para o Painel" presente
   ✓ Link WhatsApp suporte presente
```

### O que verificar no Supabase (depois)

No PC, abra Supabase Dashboard → Table Editor:

```
✓ checkout_sessions → novo registro com status "approved"
✓ restaurants → novo restaurante "Pizzaria Teste Manual"
✓ subscriptions → assinatura ativa
```

### Resultado esperado

| Item | Esperado |
|------|----------|
| Redirect MP | Funciona sem tela branca |
| QR Code PIX | Exibe corretamente no celular |
| Callback | Retorna ao site após pagamento |
| Página sucesso | Carrega < 3s, confete funciona |
| Dados no banco | Restaurante + assinatura criados |

---

## 3. Teste 2: Compra com Cartão (Feito Pra Você)

**Objetivo:** Validar compra parcelada com cartão de teste + fluxo onboarding.

### Passo a passo

```
1. Navegue para: /comprar/restaurante
   (testar template diferente do Teste 1)

2. Selecione plano "Feito Pra Você" (R$ 717 cartão / 3x R$ 239)

3. Preencha:
   • Nome do negócio: "Restaurante Teste Cartão"
   • Seu nome: "APRO"
   • Email: outro email (ou o mesmo com +tag: seu+teste2@gmail.com)
   • WhatsApp: 12999887766

4. Selecione "Cartão de Crédito"

5. Toque em "Proceder para pagamento"
   → Redirect para Mercado Pago

6. No Mercado Pago:
   - Escolha "Cartão de crédito"
   - Número: usar Mastercard do .env.local (linha 47)
   - Titular: "APRO"
   - CVV: 123
   - Validade: 11/30
   - CPF: 12345678909
   - Parcelas: 3x

7. Confirmar pagamento

8. Após aprovação:
   → Redirect para: /pagamento/sucesso
   → Botão "Prosseguir" leva para /onboarding

9. (Teste do onboarding na seção 10)
```

### Resultado esperado

| Item | Esperado |
|------|----------|
| Parcelamento | 3x exibido corretamente |
| Cartão de teste | Aceito sem erro |
| Nome APRO | Pagamento aprovado |
| Redirect | Retorna ao site automaticamente |
| Onboarding | Link disponível na página de sucesso |

---

## 4. Teste 3: Pagamento recusado

**Objetivo:** Verificar que a página de erro funciona corretamente.

### Passo a passo

```
1. Navegue para: /comprar/lanchonete

2. Preencha formulário normalmente

3. Selecione "Cartão de Crédito"

4. No Mercado Pago:
   - Número: Visa do .env.local (linha 48)
   - Titular: "FUND" (simula saldo insuficiente)
   - CVV: 123
   - Validade: 11/30
   - CPF: 12345678909

5. Confirmar pagamento

6. Resultado esperado:
   → Redirect para: /pagamento/erro
   → Exibe: ícone vermelho, possíveis motivos
   → Botões: "Tentar novamente" + "Falar com suporte"
```

### Variações para testar

| Titular | Resultado esperado |
|---------|-------------------|
| FUND | Saldo insuficiente |
| SECU | CVV inválido (security code) |
| EXPI | Cartão vencido |
| OTHE | Erro genérico |

Teste pelo menos 2 variações para confirmar que cada uma exibe a mensagem correta.

---

## 5. Teste 4: Pagamento pendente

**Objetivo:** Verificar a página de PIX pendente com polling automático.

### Passo a passo

```
1. Navegue para: /comprar/cafeteria?plano=self-service

2. Preencha formulário

3. Selecione PIX

4. No Mercado Pago: INICIE o PIX mas NÃO PAGUE

5. Volte ao site (ou espere redirect automático)

6. Resultado esperado:
   → Página: /pagamento/pendente
   → Ícone: relógio amarelo
   → Texto: "Expira em 30 minutos"
   → Instruções PIX: 3 passos visíveis
   → Polling: a cada 10s tenta verificar status
   → Botão: "Já paguei, verificar agora"

7. Toque em "Já paguei, verificar" SEM ter pago
   → Esperado: Continua pendente, não redireciona

8. (Opcional) Complete o PIX no sandbox
   → Esperado: Página atualiza automaticamente para sucesso
```

---

## 6. Teste 5: Cupom de desconto

**Objetivo:** Verificar validação de cupons.

### Passo a passo

```
1. Navegue para: /comprar/bar

2. Preencha o formulário

3. No campo de cupom, teste:

   a) Cupom inexistente: "CODIGOFALSO"
      → Esperado: mensagem de erro, desconto NÃO aplicado

   b) Cupom vazio: deixar em branco e clicar "Aplicar"
      → Esperado: nada acontece ou erro sutil

   c) Cupom com caracteres especiais: "'; DROP TABLE coupons; --"
      → Esperado: erro de validação (NÃO erro de servidor)

   d) Cupom válido (se houver): aplicar e verificar
      → Esperado: desconto aparece no resumo de valor
      → Valor PIX e Cartão recalculados
```

> **Nota:** Para ter um cupom válido, crie um na tabela `coupons` do Supabase antes de testar. Campos mínimos: `code`, `discount_percent`, `active`, `expires_at`.

---

## 7. Teste 6: Validações de formulário

**Objetivo:** Confirmar que o formulário rejeita dados inválidos no celular.

### Testes de campo

Acesse `/comprar/pizzaria` e teste cada cenário:

| Campo | Input | Esperado |
|-------|-------|----------|
| Nome negócio | vazio | Não permite enviar |
| Nome negócio | "AB" (2 chars) | Erro: mínimo 3 caracteres |
| Nome negócio | 121 caracteres | Erro: máximo 120 |
| Seu nome | vazio | Não permite enviar |
| Seu nome | "A" | Erro: mínimo 3 |
| Email | "emailsemarroba" | Erro: email inválido |
| Email | vazio | Não permite enviar |
| WhatsApp | "abc" | Erro ou normaliza para vazio |
| WhatsApp | "123" (< 10 dígitos) | Erro: mínimo 10 dígitos |
| WhatsApp | 21 dígitos | Erro: máximo 20 |
| WhatsApp | "12999887766" | Aceito (11 dígitos) |

### Teste de envio sem login

```
1. Abra /comprar/pizzaria em aba anônima (sem estar logado)
2. Preencha todos os campos corretamente
3. Toque "Proceder para pagamento"
4. Esperado: salva draft, redireciona para /login
5. Após login com Google: retorna ao checkout com dados preenchidos
```

---

## 8. Teste 7: Painel do restaurante

**Objetivo:** Verificar que o painel funciona após compra bem-sucedida.

### Pré-requisito

Complete o Teste 1 ou Teste 2 com sucesso primeiro.

### Passo a passo

```
1. Acesse /painel (logado com o email da compra)

2. Dashboard deve exibir:
   ✓ Total de produtos (produtos de amostra já criados)
   ✓ Pedidos hoje: 0
   ✓ Pendentes: 0
   ✓ Faturamento: R$ 0

3. Checklist de setup:
   ✓ "Criar restaurante" — marcado (já criado na compra)
   ✓ "Adicionar 5 produtos" — parcial (amostras criadas)
   ✓ "Testar cardápio" — pendente
   ✓ "Receber 1 pedido real" — pendente

4. Navegue para:
   • /painel/produtos → lista de produtos de amostra
   • /painel/categorias → categorias pré-criadas
   • /painel/editor → editor visual do cardápio
   • /painel/qrcode → QR code do restaurante
   • /painel/configuracoes → configurações do restaurante

5. Teste no editor:
   • Alterar nome do restaurante
   • Mudar cor/tema
   • Salvar → verificar que mudança persiste

6. Teste o cardápio público:
   • No painel, toque em "Ver cardápio"
   • Abre /r/[slug-do-restaurante]
   • Cardápio deve carregar com produtos de amostra
```

### Testes mobile específicos

```
✓ Dashboard responsivo (não quebra)
✓ Menu lateral abre corretamente
✓ Botões não sobrepõem no celular
✓ Editor funciona com touch
✓ QR code é escaneável pela câmera
```

---

## 9. Teste 8: Cadastro de afiliado

**Objetivo:** Testar o fluxo de afiliado pelo celular.

### Passo a passo

```
1. Acesse /afiliados

2. Esperado: landing page com benefícios
   • Comissão: 30% direto
   • Bônus por metas (R$ 10 a R$ 100)
   • Pagamento PIX mensal

3. Toque em "Quero ser Afiliado" / "Começar"

4. Se pedir login → /login → Google OAuth

5. Após login, preencha cadastro:
   • Nome completo
   • Chave PIX (CPF, email, telefone ou chave aleatória)
   • (Outros campos se houver)

6. Confirme cadastro

7. Acesse /painel/afiliados (dashboard do afiliado)
   ✓ Link de indicação gerado (ex: zairyx.com/?ref=ABC123)
   ✓ Comissões: R$ 0,00
   ✓ Indicados: 0

8. Copie o link de indicação

9. Abra em aba anônima no celular
   ✓ Cookie aff_ref deve ser setado (30 dias)
   ✓ Site carrega normalmente

10. Teste self-referral:
    - Use o próprio link para comprar
    → Esperado: comissão NÃO é gerada para si mesmo
```

---

## 10. Teste 9: Onboarding (Feito Pra Você)

**Objetivo:** Testar o formulário de onboarding após compra "Feito Pra Você".

### Pré-requisito

Complete o Teste 2 (compra Feito Pra Você) primeiro.

### Passo a passo

```
1. Após pagamento aprovado, acesse /onboarding
   (ou clique "Prosseguir" na página de sucesso)

2. Formulário de onboarding:
   • Tipo de negócio: selecionar um dos 10 tipos
     (Delivery, Pizzaria, Hamburgueria, Lanchonete,
      Restaurante, Bar/Pub, Cafeteria, Açaíteria,
      Doceria, Outro)
   • WhatsApp do negócio
   • Categorias (ex: "Pizzas", "Bebidas", "Sobremesas")
   • Produtos por categoria (nome + preço)

3. Preencha com dados de teste:
   Tipo: "Pizzaria"
   WhatsApp: 12999887766
   
   Categoria 1: "Pizzas"
   - Margherita — R$ 39,90
   - Calabresa — R$ 35,90
   - Quatro Queijos — R$ 42,90
   
   Categoria 2: "Bebidas"
   - Coca-Cola 2L — R$ 12,00
   - Guaraná — R$ 10,00

4. Toque "Enviar" / "Finalizar"

5. Resultado esperado:
   → Status muda para "pedido_recebido"
   → Redirect para /status?checkout=CHK-xxx
   → Mostra progresso: Recebido → Aguardando → Produção → Revisão → Publicado

6. Acompanhe em /status:
   ✓ Barra de progresso visível
   ✓ Status atualiza (admin muda via /admin/freelancers)
```

---

## 11. Teste 10: Segurança e chaos

**Objetivo:** Confirmar que o sistema se protege contra inputs maliciosos no celular.

### Testes de injeção

Acesse `/comprar/pizzaria` e insira nos campos:

```
Nome do negócio: <script>alert('xss')</script>
→ Esperado: texto exibido como texto puro, NÃO executa script

Nome do negócio: '; DROP TABLE restaurants; --
→ Esperado: aceita como nome normal (SQL não executa)

Email: admin@zairyx.com' OR '1'='1
→ Esperado: erro de validação de email
```

### Testes de acesso indevido

```
1. Sem estar logado, acesse diretamente:
   • /painel → Esperado: redirect para /login
   • /admin → Esperado: redirect para /login
   • /meus-templates → Esperado: redirect para /login
   • /onboarding → Esperado: redirect para /login

2. Logado como usuário NORMAL, acesse:
   • /admin → Esperado: erro 401 ou redirect
   (Só globemarket7@gmail.com é admin)

3. Teste URLs fake:
   • /pagamento/sucesso?checkout=FAKE-123
   → Esperado: mostra erro ou "pedido não encontrado"
   
   • /pagamento/sucesso?checkout=../../etc/passwd
   → Esperado: não exibe dados sensíveis
```

### Testes de rate limiting

```
No celular, toque rapidamente 10+ vezes no botão de submit
→ Esperado: apenas 1 checkout criado (debounce funciona)

Recarregue a página 20+ vezes em sequência rápida
→ Esperado: site continua funcionando (não recebe 429)
```

---

## 12. Teste 11: Navegação geral mobile

**Objetivo:** Confirmar que todas as páginas são usáveis no celular.

### Checklist de páginas públicas

| Página | URL | Verificar |
|--------|-----|-----------|
| Home | / | Hero visível, CTA clicável, não corta texto |
| Templates | /templates | Cards em grid/lista, scroll funciona |
| Preview | /templates/pizzaria | Imagens carregam, botão comprar visível |
| Preços | /precos | Tabela de preços legível, não quebra |
| Afiliados | /afiliados | Landing page completa |
| Ranking | /afiliados/ranking | Lista carrega |
| Login | /login | Botão Google funciona |
| Termos | /termos | Texto completo, scroll funciona |
| Privacidade | /privacidade | Texto completo |

### Checklist visual mobile

```
✓ Nenhum texto cortado ou sobreposto
✓ Botões grandes o suficiente para tocar (min 44x44px)
✓ Formulários não ficam escondidos atrás do teclado
✓ Images carregam (CDN R2 funcionando)
✓ Menu hamburger funciona (se houver)
✓ Scroll suave, sem travadas
✓ Não há scroll horizontal indesejado
✓ Cores legíveis (contraste OK)
✓ Loading states aparecem (skeleton/spinner)
✓ Dark mode funciona (se implementado)
```

### Teste de orientação

```
1. Coloque o celular em landscape (horizontal)
2. Navegue por /templates → /comprar/pizzaria → formulário
→ Esperado: layout adaptado, campos não quebram
```

---

## 13. Checklist final

### Depois de todos os testes, marque:

**Fluxo de compra:**
```
[ ] PIX aprovado (Teste 1) — página sucesso
[ ] Cartão aprovado (Teste 2) — página sucesso
[ ] Cartão recusado (Teste 3) — página erro
[ ] PIX pendente (Teste 4) — página pendente com polling
[ ] Cupom válido aplicado (Teste 5)
[ ] Cupom inválido rejeitado (Teste 5)
```

**Formulários:**
```
[ ] Validação de campos obrigatórios (Teste 6)
[ ] Redirect login → retorna ao checkout (Teste 6)
[ ] Dados salvos no banco corretamente (verificar Supabase)
```

**Pós-compra:**
```
[ ] Painel carrega com dados (Teste 7)
[ ] Produtos de amostra criados (Teste 7)
[ ] Editor funciona no celular (Teste 7)
[ ] QR code gerado e escaneável (Teste 7)
[ ] Cardápio público acessível (Teste 7)
```

**Afiliados:**
```
[ ] Cadastro funciona (Teste 8)
[ ] Link de indicação gerado (Teste 8)
[ ] Cookie aff_ref setado (Teste 8)
```

**Onboarding:**
```
[ ] Formulário preenchido e enviado (Teste 9)
[ ] Status tracking funciona (Teste 9)
```

**Segurança:**
```
[ ] XSS bloqueado (Teste 10)
[ ] SQL injection bloqueado (Teste 10)
[ ] Rotas protegidas redirecionam (Teste 10)
[ ] Admin inacessível para user comum (Teste 10)
[ ] Rate limiting / debounce funciona (Teste 10)
```

**Mobile:**
```
[ ] Todas as páginas públicas renderizam (Teste 11)
[ ] Formulários usáveis com teclado mobile (Teste 11)
[ ] Imagens carregam pelo CDN (Teste 11)
[ ] Landscape funciona (Teste 11)
```

---

## 14. Troubleshooting

### Problema: "Página em branco após pagamento"

```
Causa: Callback URL do MP não está configurada corretamente
Solução: Verificar NEXT_PUBLIC_SITE_URL no .env.local
         Deve ser a URL exata do site (com https://)
```

### Problema: "Webhook não processa pagamento"

```
Causa: MP_WEBHOOK_SECRET não bate com o configurado no painel MP
Solução:
1. Painel Mercado Pago → Webhooks → Configurar
2. URL: https://[seu-dominio]/api/webhook/mercadopago
3. Eventos: payment.created, payment.updated
4. Copiar o secret gerado → colar no .env.local
```

### Problema: "Redirect para /login infinito"

```
Causa: Cookies de sessão Supabase não estão sendo setados
Solução: Verificar que NEXT_PUBLIC_SUPABASE_URL e ANON_KEY estão corretos
         Em servidor local: usar http://localhost:3000 (não IP)
```

### Problema: "Erro 429 (rate limited)"

```
Causa: Muitas requisições em pouco tempo
Solução: Esperar 60 segundos e tentar novamente
         Rate limits: auth 100/min, API 500/min, webhook 500/min
```

### Problema: "Cartão de teste não funciona"

```
Causa: Usando cartão de teste em modo produção (ou vice-versa)
Solução: Confirmar que MERCADO_PAGO_ENV=sandbox no .env.local
         Cartões de teste SÓ funcionam em sandbox
```

### Problema: "QR PIX não aparece no celular"

```
Causa: Sandbox do MP às vezes não gera QR visual
Solução: Usar o código "copiar e colar" do PIX (copia texto)
         Ou testar com cartão em vez de PIX
```

---

## Notas de Segurança

1. **Nunca** compartilhe o `.env.local` com ninguém
2. **Nunca** faça commit do `.env.local` (já está no `.gitignore`)
3. As credenciais de teste do MP são específicas da sua conta
4. O `GITHUB_TOKEN` no `.env.local` é pessoal — não compartilhar
5. Após os testes, **volte o ambiente para produção**:
   ```
   MERCADO_PAGO_ENV=production
   NEXT_PUBLIC_MERCADO_PAGO_ENV=production
   ```
6. Delete restaurantes de teste no Supabase após finalizar

---

## Após completar todos os testes

```
SANDBOX OK:
  [x] Todos os 11 testes passaram
  [x] Checklist final 100% marcado

PRÓXIMO PASSO — TESTE EM PRODUÇÃO:
  [ ] Trocar env para production
  [ ] Fazer UMA compra real com cartão (R$ mais barato possível)
  [ ] Confirmar webhook em produção 
  [ ] Fazer refund pelo dashboard Mercado Pago
  [ ] Confirmar que refund processa corretamente
  [ ] GO-LIVE ✅
```
