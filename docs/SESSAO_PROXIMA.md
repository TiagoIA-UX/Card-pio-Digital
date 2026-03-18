# Sessão Próxima — 18/03/2026

## O que foi feito hoje (17/03/2026)

1. **Auditoria jurídica completa** dos textos legais (`/termos`, `/privacidade`, `/cookies`, `/politica`) contra LGPD e CDC
2. **Identificados 24 achados** (3 críticos, 8 altos, 9 médios, 4 baixos)
3. **Correções independentes aplicadas:**
   - Data fixa "18 de março de 2026" nos 3 documentos (antes usava `new Date()` — enganoso)
   - Cláusula "como está" (as-is) reescrita — era nula pelo CDC Art. 51 §I
   - Foro alterado de "São Paulo/SP" para domicílio do consumidor — CDC Art. 101 §I
   - Direito de arrependimento de 7 dias adicionado — CDC Art. 49
   - Renovação automática documentada na seção de pagamentos
   - Seção "Transferência Internacional de Dados" adicionada — LGPD Art. 33
   - Seção "Base Legal do Tratamento" adicionada — LGPD Art. 7º
   - Direitos do titular completos conforme LGPD Art. 18
   - Terceiros identificados (Supabase, Vercel, Cloudflare R2, Mercado Pago, Groq)
   - Tabela de cookies reais adicionada
   - Seção "Como revogar consentimento" adicionada — LGPD Art. 8º §5

## O que falta fazer (por prioridade)

### Prioridade ALTA — Depende de resposta do Tiago
- [ ] Adicionar CNPJ da Zairyx em todos os documentos jurídicos
- [ ] Adicionar endereço comercial da controladora
- [ ] Nomear DPO/encarregado de dados (LGPD Art. 41)
- [ ] Confirmar emails de contato funcionais
- [ ] Confirmar modelo de renovação (automática vs. manual) — texto já assume automática

### Prioridade MÉDIA
- [ ] Dados coletados automaticamente (IP, user-agent, Google OAuth) na Política de Privacidade
- [ ] Verificar se Vercel Analytics coleta IP (afeta texto "dados anônimos" na Política de Cookies)
- [ ] Renomear "Política de Transparência" para algo menos confuso (ex.: "Sobre o Serviço")

### Prioridade BAIXA
- [ ] `TEMPLATES_SEED` em `unlock-all-templates/route.ts` — faltam 7 novos templates
- [ ] Carrinho e SEO regional (próxima fase)

## 5 Perguntas pendentes para o Tiago

> ⚠️ **Estas respostas são necessárias antes de finalizar os textos jurídicos.**

1. **CNPJ da Zairyx Soluções Tecnológicas** — obrigatório pelo CDC Art. 31 e Marco Civil Art. 7º
2. **Endereço comercial** (pode ser virtual/coworking) — obrigatório para identificar a controladora
3. **Nome do DPO/encarregado de dados** — pode ser o próprio Tiago. LGPD Art. 41 exige nomear
4. **Os emails `contato@cardapio.digital` e `privacidade@cardapio.digital` estão funcionando?** — se não, qual canal real de contato?
5. **A renovação do plano mensal é automática (Mercado Pago recorrente) ou o cliente paga manualmente cada mês?** — o texto já assume renovação automática; precisa confirmar
