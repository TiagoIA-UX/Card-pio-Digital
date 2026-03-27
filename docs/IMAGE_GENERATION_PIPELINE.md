# Pipeline de Geração de Imagens via IA — Guia Completo

> **Última atualização:** 2026-03-24  
> **Aplicável a:** Cardápio Digital / Zairyx — 15 templates, 877 produtos

---

## Visão Geral

O pipeline gera imagens individuais para cada produto dos templates e as mapeia em `lib/generated-template-product-images.ts`. O app usa esse mapeamento no `resolveTemplateProductImageUrl()` para exibir fotos dos produtos no cardápio.

Hoje, o fluxo mais pragmático e mantido no repositório é o `Pexels Smart`, porque ele busca fotos melhores por produto sem depender de geração via IA paga.

```
scripts/image-prompts.csv          ← 877 produtos + prompts prontos
         ↓ (escolha um gerador ou buscador)
┌─────────────────────────────────────────────────────────────┐
│  Pexels Smart (ativo, recomendado)                          │
│  Pollinations.ai (gratuito, sem API key)                    │
│  DALL-E 3 (OpenAI, ~$35 total)                              │
│  Gemini Imagen 3 (Google AI, ~$35 total)                    │
└─────────────────────────────────────────────────────────────┘
         ↓
public/template-images/*.jpg       ← imagens geradas localmente
         ↓
node scripts/update-image-map-local.js
         ↓
lib/generated-template-product-images.ts   ← mapeamento atualizado
         ↓
npm run build → deploy Vercel      ← imagens servidas via Next.js
```

---

## Scripts Disponíveis

| Script npm                             | Arquivo                           | Provedor        | Custo        | API Key          |
| -------------------------------------- | --------------------------------- | --------------- | ------------ | ---------------- |
| `npm run generate:images:pexels`       | `update-images-pexels-smart.mjs`  | Pexels          | baixo        | `PEXELS_API_KEY` |
| `npm run generate:images:pollinations` | `generate-images-pollinations.js` | Pollinations.ai | **Gratuito** | Não              |
| `npm run generate:images:dalle`        | `generate-images-dalle.js`        | OpenAI DALL-E 3 | ~$35         | `OPENAI_API_KEY` |
| `npm run generate:images:gemini`       | `generate-images-gemini.js`       | Google Imagen 3 | ~$35         | `GEMINI_API_KEY` |
| `npm run generate:images:update-map`   | `update-image-map-local.js`       | —               | —            | —                |

---

## Opção 0 — Pexels Smart (Recomendado Hoje)

Esse é o “gerador inteligente de catálogo” usado no fluxo mais recente. Na prática ele não gera imagens do zero: ele procura no Pexels por cada produto individualmente, tenta traduzir o nome do produto para inglês, evita repetir a mesma foto entre itens e grava o resultado final em `lib/generated-template-product-images.ts`.

### O que ele faz

- lê `scripts/image-prompts.csv` para ter a lista completa do catálogo
- usa o nome específico do produto como query principal
- traduz termos brasileiros para buscas melhores em inglês
- tenta queries alternativas quando a primeira busca falha
- evita reutilizar o mesmo `photo_id` em vários produtos
- salva progresso local em `scripts/.pexels-progress.json`
- atualiza `lib/generated-template-product-images.ts`

### Execução

Windows PowerShell:

```powershell
npm run generate:images:pexels:dry -- --template=restaurante
npm run generate:images:pexels -- --template=restaurante
npm run generate:images:pexels
```

Pré-requisito:

```env
PEXELS_API_KEY=...
```

### Quando usar

- quando você quer melhorar o catálogo rapidamente
- quando precisa trocar fotos produto a produto
- quando quer evitar custo com geração via IA paga

---

## Opção 1 — Pollinations.ai (Recomendado para Testes)

Gera URLs do Pollinations.ai (serviço gratuito de IA de imagens) e as grava diretamente em `lib/generated-template-product-images.ts`. **Não baixa arquivos** — as imagens são servidas diretamente da URL.

```powershell
# Gera o mapeamento completo (877 produtos)
npm run generate:images:pollinations

# Apenas visualiza sem gravar
npm run generate:images:pollinations -- --dry-run
```

**Resultado:** `lib/generated-template-product-images.ts` atualizado com URLs do Pollinations.

---

## Opção 2 — DALL-E 3 (OpenAI)

Gera e baixa imagens de alta qualidade via OpenAI DALL-E 3.

### Pré-requisitos

```powershell
# Conta em platform.openai.com com créditos
# Tier 1: 5 imagens/minuto (aumenta com uso)
$env:OPENAI_API_KEY="sk-..."
```

### Execução

```powershell
# Gera tudo (~2-3 horas no tier 1)
npm run generate:images:dalle

# Só um template (ex: pizzaria)
npm run generate:images:dalle -- --template=pizzaria

# Continua a partir do produto #100
npm run generate:images:dalle -- --start=100

# Visualiza prompts sem gerar
npm run generate:images:dalle -- --dry-run
```

O script retoma automaticamente do ponto onde parou (arquivo `.dalle-progress.json`).

### Após geração

```bash
# Atualiza o mapeamento com os caminhos locais
npm run generate:images:update-map
```

---

## Opção 3 — Gemini Imagen 3 (Google AI) ✨

Gera e baixa imagens via Google Gemini Imagen 3 (`imagen-3.0-generate-002`).

### Pré-requisitos

```powershell
# Acesse aistudio.google.com/app/apikey para obter sua chave
$env:GEMINI_API_KEY="AIza..."
```

### Execução

```powershell
# Gera tudo (~1-2 horas)
npm run generate:images:gemini

# Só um template
npm run generate:images:gemini -- --template=restaurante

# Com 3 downloads simultâneos (mais rápido)
npm run generate:images:gemini -- --concurrency=3

# Continua de onde parou
npm run generate:images:gemini -- --start=200

# Visualiza prompts sem gerar
npm run generate:images:gemini -- --dry-run
```

O script retoma automaticamente do ponto onde parou (arquivo `.gemini-progress.json`).

### Parâmetros Imagen 3 usados

| Parâmetro           | Valor             | Descrição                            |
| ------------------- | ----------------- | ------------------------------------ |
| `aspectRatio`       | `1:1`             | Quadrado (ideal para cardápio)       |
| `sampleCount`       | `1`               | 1 imagem por chamada                 |
| `safetyFilterLevel` | `BLOCK_ONLY_HIGH` | Filtro permissivo (food photography) |
| `personGeneration`  | `DONT_ALLOW`      | Sem pessoas nas imagens              |

### Após geração

```bash
# Atualiza o mapeamento com os caminhos locais
npm run generate:images:update-map
```

---

## Como os Prompts Foram Criados

O arquivo `scripts/image-prompts.csv` contém 877 prompts e descrições-base usados pelos scripts. Hoje ele é tratado como a fonte de entrada do catálogo.

```
{Nome do Produto}, {contexto do template}, professional food photography,
overhead flat lay, white marble background, natural lighting, high resolution,
appetizing, commercial quality, no text, no watermark, no people
```

Se você quiser refazer esse CSV, hoje isso precisa ser feito manualmente ou por um script dedicado ainda não restaurado no repositório atual.

---

## Mapeamento de Imagens (`lib/generated-template-product-images.ts`)

Este arquivo é gerado automaticamente. **Não edite manualmente.**

- **Chave:** `{template}::{categoria}::{ordem}::{nome}` (normalizado, sem acentos)
- **Valor:** URL pública (Pollinations, CDN) ou caminho local (`/template-images/xxx.jpg`)

### Como o app resolve imagens

```typescript
// lib/template-product-images.ts
resolveTemplateProductImageUrl({
  templateSlug,
  product,
  fallbackTemplateImageUrl,
})
// Lógica: generated map → product.imagem_url → category fallback → template banner
```

---

## Fluxo Completo de Deploy

```powershell
# 1. Gerar imagens (escolha um provedor)
npm run generate:images:pexels

# 2. Validar o build
npm run build

# 3. Commit + push
git add lib/generated-template-product-images.ts public/template-images/
git commit -m "feat: imagens AI geradas para todos os templates"
git push

# Deploy automático via Vercel ao push na main
```

---

## Troubleshooting

### Imagem não aparece no cardápio

1. Verifique se a chave existe em `lib/generated-template-product-images.ts`
2. Execute `node scripts/audit-image-mapping.js` para diagnóstico
3. Confirme que o arquivo de imagem existe em `public/template-images/`

### Rate limit (429)

- **DALL-E**: Aumente `DELAY_MS` para `15000` (4 imgs/min)
- **Gemini**: Use `--concurrency=1` (padrão) ou `DELAY_MS=2000`

### Imagem bloqueada pelo filtro de segurança (Gemini)

Ajuste `safetyFilterLevel` para `BLOCK_NONE` no script se produtos legítimos forem bloqueados (ex: bebidas alcoólicas).

### Build falha sem env vars

A build funciona sem as variáveis do Supabase — as páginas admin são dinâmicas (renderizadas em runtime). Configure no painel do Vercel antes do deploy.

---

## Custo por Provedor

| Provedor        | Modelo            | Custo/imagem | 877 imagens | Qualidade  |
| --------------- | ----------------- | ------------ | ----------- | ---------- |
| Pollinations.ai | Open source       | Grátis       | $0          | ⭐⭐⭐     |
| OpenAI          | DALL-E 3 Standard | ~$0.040      | ~$35        | ⭐⭐⭐⭐⭐ |
| Google AI       | Imagen 3          | ~$0.040      | ~$35        | ⭐⭐⭐⭐⭐ |

> Valores aproximados. Verifique os preços atuais em:
>
> - OpenAI: https://openai.com/pricing
> - Google AI: https://ai.google.dev/pricing

---

## Arquivos Relacionados

| Arquivo                                    | Descrição                                                   |
| ------------------------------------------ | ----------------------------------------------------------- |
| `scripts/image-prompts.csv`                | 877 prompts (template, categoria, nome, filename, prompt)   |
| `scripts/image-prompts.md`                 | Versão legível para uso manual (Canva AI, Midjourney, etc.) |
| `scripts/image-prompts.csv`                | Fonte de entrada dos produtos e prompts/base de busca       |
| `scripts/generate-images-dalle.js`         | Gerador via DALL-E 3                                        |
| `scripts/generate-images-gemini.js`        | Gerador via Gemini Imagen 3                                 |
| `scripts/generate-images-pollinations.js`  | Gerador via Pollinations.ai (URLs)                          |
| `scripts/update-images-pexels-smart.mjs`   | Buscador inteligente produto a produto via Pexels           |
| `scripts/update-image-map-local.js`        | Atualiza o mapeamento após download                         |
| `scripts/audit-image-mapping.js`           | Diagnóstico: chaves faltantes/órfãs                         |
| `scripts/verify-template-images.js`        | Verifica integridade das imagens                            |
| `lib/generated-template-product-images.ts` | Mapeamento gerado (fonte da verdade)                        |
| `lib/template-product-images.ts`           | Lógica de resolução de imagens                              |
| `public/template-images/`                  | Imagens baixadas localmente (gitignore'd)                   |
| `PROMPTS_IMAGENS_PRODUTOS.md`              | Prompts curados para uso manual                             |
| `CATALOGO_IMAGENS_PRODUTOS.md`             | Links gratuitos (Pexels, Unsplash, Pixabay)                 |
