## Checklist de Pull Request

### 📋 Mudanças gerais

- [ ] Self-review feito (leu o diff completo)
- [ ] Testes passando (`npm run build` sem erros)
- [ ] Sem `console.log` ou `debugger` esquecidos

---

### 🗄️ Banco de dados (preencher se alterou schema)

**Criei ou alterei migrations?**

- [ ] Sim → completar checklist abaixo
- [ ] Não → pular seção

**Se sim:**

- [ ] Arquivo criado em `supabase/migrations/NNN_descricao.sql` (numeração sequencial)
- [ ] **Nunca** alterei o banco diretamente pelo Supabase Dashboard
- [ ] Novo `CREATE TABLE` tem `ENABLE ROW LEVEL SECURITY`
- [ ] Todo `CREATE POLICY` tem `TO role` explícito (ex: `TO service_role`, `TO authenticated`)
- [ ] **Sem** `FOR ALL USING (true)` sem restrição de role
- [ ] Tabelas financeiras (`cobrancas_pix`, `subscriptions`, `orders`) → escrita restrita a `service_role`

---

### 🔒 Segurança

- [ ] Nenhuma credencial, API key ou secret no código/migration
- [ ] Inputs de formulário validados com Zod no servidor
- [ ] Rotas admin protegidas com `requireAdmin(req, 'admin')`
- [ ] Sem `USING (true)` sem role em policies RLS

---

### 🔗 APIs e integrações

- [ ] Novas rotas `/api` têm validação de autenticação
- [ ] Novas rotas `/api/cron` verificam `CRON_SECRET`
- [ ] Webhooks externos validam assinatura/origin

---

> ℹ️ Referência: [docs/MIGRATIONS_GOVERNANCE.md](docs/MIGRATIONS_GOVERNANCE.md)
