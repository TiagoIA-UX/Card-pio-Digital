# Design System — Canal Digital · Rede de Afiliados

> **Fonte de verdade** para qualquer dev ou IA que tocar no módulo de afiliados.  
> Última revisão: março / 2026.

---

## 1. Cores Primárias

| Token          | Hex       | Tailwind equiv.  | Uso principal                                |
| -------------- | --------- | ---------------- | -------------------------------------------- |
| **Laranja**    | `#E46212` | `orange-500/600` | CTAs, barra de progresso ativa, badges       |
| **Vermelho**   | `#FB3036` | `red-500`        | Alertas, destaques negativos, gradiente hero |
| Teal (suporte) | —         | `teal-500`       | Barra de progresso **concluída**             |
| Fundo escuro   | —         | `zinc-900`       | Cards do painel dark-mode                    |
| Fundo médio    | —         | `zinc-800`       | Nível ativo no HierarquiaWidget              |
| Divisores      | —         | `zinc-700`       | Bordas internas dos cards                    |

### Tailwind tokens rápidos

```html
<!-- Botão primário -->
<button class="bg-orange-500 text-white hover:bg-orange-600">
  <!-- Botão secundário (outline) -->
  <button class="border border-orange-300 text-orange-700 hover:bg-orange-50">
    <!-- Badge ativo -->
    <span class="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-300">
      <!-- Barra de progresso ativa -->
      <div class="h-full rounded-full bg-orange-500 transition-all duration-700">
        <!-- Barra de progresso concluída -->
        <div class="h-full rounded-full bg-teal-500"></div></div
    ></span>
  </button>
</button>
```

---

## 2. Tipografia

| Fonte     | Uso                                | Como importar                      |
| --------- | ---------------------------------- | ---------------------------------- |
| **Syne**  | Títulos, nomes de nível, destaques | `next/font/google` → `Syne`        |
| **Inter** | Corpo de texto, labels, dados      | já configurado em `app/layout.tsx` |

> **Nota de implementação:** o `app/layout.tsx` atual carrega apenas Inter. A Syne deve ser adicionada ao layout global e exposta como `font-syne` via variável CSS (`--font-syne`), seguindo o mesmo padrão do Inter já existente.

```ts
// app/layout.tsx (adicionar ao lado do Inter)
import { Inter, Syne } from 'next/font/google'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})
```

```html
<!-- Uso nas páginas -->
<h1 class="font-syne text-3xl font-extrabold">Hierarquia Corporativa</h1>
```

---

## 3. Hierarquia de Afiliados

Fonte de verdade em código: [`lib/affiliate-tiers.ts`](lib/affiliate-tiers.ts)

| Nível       | Slug          | Canais Digitais | Bônus único | Extra comissão | Comissão total |
| ----------- | ------------- | :-------------: | :---------: | :------------: | :------------: |
| Trainee     | `trainee`     |      0 – 2      |      —      |       —        |      30%       |
| Analista    | `analista`    |      3 – 9      |    R$ 50    |       —        |      30%       |
| Coordenador | `coordenador` |     10 – 24     |   R$ 150    |       —        |      30%       |
| Gerente     | `gerente`     |     25 – 49     |   R$ 300    |       —        |      30%       |
| Diretor     | `diretor`     |     50 – 99     |   R$ 600    |      +2%       |    **32%**     |
| Sócio       | `socio`       |      100+       |  R$ 1.500   |      +5%       |    **35%**     |

### Regras de negócio

- Bônus é **único** — pago na primeira vez que o afiliado atinge o mínimo do nível.
- `comissaoExtra` é somado ao `PCT_VENDEDOR_BASE = 30%`.
- Líderes têm **adicionalmente** 10% sobre a rede (`PCT_LIDER`). Requisito: mínimo 5 vendedores ativos.
- A empresa sempre retém ≥ 60% da receita (margem segura validada em análise financeira de março/2026).

---

## 4. Componentes Base

### 4.1 `HierarquiaWidget`

**Localização:** [`components/afiliados/hierarquia-widget.tsx`](components/afiliados/hierarquia-widget.tsx)

```tsx
import { HierarquiaWidget } from '@/components/afiliados/hierarquia-widget'

;<HierarquiaWidget
  totalCanais={stats.total_indicados} // número de canais ativos
  totalBonusRecebido={totalBonusRecebido} // soma de bônus já pagos
  nomePendente="Coordenador" // opcional — exibe "X pendente"
/>
```

**Aparência:**

- Fundo `zinc-900`, borda `zinc-700`, bordas arredondadas `rounded-2xl`
- Linha lateral `border-l-2 border-orange-500` no nível atual
- Barra de progresso: `bg-orange-500` (em progresso) / `bg-teal-500` (concluído)
- Níveis futuros ficam `opacity-60` com ícone de cadeado (`Lock`)
- Footer exibe: próxima promoção + total de bônus já recebidos

### 4.2 Badges de Cargo

Padrão para indicar o tipo/nível do afiliado em qualquer listagem:

```tsx
// Nível hierárquico (HierarquiaWidget e páginas de ranking)
<span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] text-orange-300">
  você está aqui
</span>

// Badge "Líder Zairyx" (ranking)
<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
  Líder Zairyx
</span>

// Badge "Vendedor" (ranking)
<span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
  Vendedor
</span>

// Badge bônus disponível
<span className="rounded-full border border-zinc-600 px-2 py-0.5 text-[11px] text-zinc-300">
  Bônus R$ 300
</span>

// Badge nível concluído
<span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
  concluído
</span>
```

### 4.3 Card de Estatística (dark)

Padrão usado no painel e no ranking:

```tsx
<div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
  <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Label</p>
  <p className="mt-1 text-3xl font-extrabold text-orange-400">42</p>
  <p className="mt-0.5 text-xs text-zinc-400">Descrição complementar</p>
</div>
```

### 4.4 Barra de Progresso isolada

```tsx
<div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
  <div
    className="h-full rounded-full bg-orange-500 transition-all duration-700"
    style={{ width: `${pct}%` }}
  />
</div>
```

---

## 5. Padrões de Layout por Página

### Páginas dark (painel, ranking, widget)

```
bg-zinc-950 ou bg-zinc-900
texto principal: text-zinc-100
texto secundário: text-zinc-400 (mínimo — não usar zinc-300 ou menos)
bordas: border-zinc-700 ou border-zinc-800
```

### Páginas light (mapa, cadastro, /afiliados landing)

```
bg-white ou bg-orange-50
texto principal: text-zinc-900
texto secundário: text-zinc-600 (mínimo — não usar zinc-400 ou menos em light)
bordas: border-orange-200
destaques: text-orange-600, bg-orange-500
```

### Regra de contraste obrigatória

- **Dark:** nunca usar `text-zinc-300` ou mais claro diretamente em fundo `zinc-800+` sem motivo explícito.
- **Light:** nunca usar `text-zinc-400` ou mais claro em fundo branco.

---

## 6. Páginas do Módulo de Afiliados

| Página                | Tema  | HierarquiaWidget | Status design                                                       |
| --------------------- | ----- | :--------------: | ------------------------------------------------------------------- |
| `/afiliados`          | light |        ✗         | revisar contraste                                                   |
| `/afiliados/cadastro` | light |        ✗         | revisar contraste                                                   |
| `/afiliados/ranking`  | mixed |        ✗         | badges atuais são `Líder/Vendedor` — migrar para slugs hierárquicos |
| `/afiliados/mapa`     | light |        ✗         | cores orange já corretas                                            |
| `/painel/afiliados`   | dark  |        ✓         | **nasce no padrão** (a construir)                                   |
| `/admin/comissoes`    | light |        ✗         | revisar cores de botões                                             |
| `/admin/equipe`       | light |        ✗         | revisar cores + indicadores de hierarquia                           |

---

## 7. Estrutura de Arquivos do Módulo

```
lib/
  affiliate-tiers.ts          ← constantes centralizadas (tiers, helpers)

components/afiliados/
  hierarquia-widget.tsx       ← widget de progressão corporativa

app/afiliados/
  page.tsx                    ← landing pública de afiliados
  ranking/page.tsx            ← ranking público
  mapa/page.tsx               ← mapa de afiliados por estado

app/painel/afiliados/
  page.tsx                    ← painel privado do afiliado logado

app/admin/
  comissoes/page.tsx          ← admin: aprovar/pagar comissões
  equipe/page.tsx             ← admin: gerenciar time interno

supabase/migrations/
  011_*.sql                   ← tabela affiliate_bonuses
  013_*.sql                   ← sistema de afiliados base
  014_*.sql                   ← comissões e líder
  015_*.sql                   ← seed owner admin
  016_affiliate_tiers.sql     ← ⏳ tiers hierárquicos (a criar)
```

---

## 8. Tokens de Decisão (Decision Log)

| Decisão                                       | Motivo                                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `orange-500` como cor primária (não vermelho) | O `#FB3036` fica reservado para gradientes de hero e alertas. Laranja é mais amigável em barras de progresso e botões de ação.                 |
| Hierarquia Trainee→Sócio com 6 níveis         | Pesquisa de UX: 6 níveis criam aspiração sem parecer inalcançável. Sócio (100 rest.) é difícil mas possível em ~12 meses de trabalho dedicado. |
| Bônus único por nível (não recorrente)        | Reduz risco financeiro: empresa paga uma vez, não mensalmente. Incentivo de ingresso + progressão.                                             |
| Sócio recebe +5% de comissão direta           | Com 100 canais Pro (R$129), Sócio gera ~R$4.500/mês apenas em recorrência. Isso justifica o esforço e a empresa ainda retém 65%.               |
| Fundo `zinc-900` no painel                    | Diferenciação visual clara entre área pública (light) e área privada do afiliado (dark).                                                       |
