# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Decomposed `app/page.tsx` (638 lines) into `components/home/` for better maintainability
- `components/home/HeroSection.tsx` — Hero section with background, CTA, and metric cards
- `components/home/BenefitsSection.tsx` — Benefits highlights section
- `components/home/ProductSection.tsx` — Dashboard and editor screenshot section
- `components/home/NichesSection.tsx` — Niche template grid
- `components/home/FeaturesSection.tsx` — Platform features dark section
- `components/home/HowItWorksSection.tsx` — How it works / process steps section
- `components/home/FinalCtaSection.tsx` — Final gradient CTA section
- `components/home/home-data.ts` — Shared data constants for home components
- `app/admin/loading.tsx` — Skeleton loading state for admin routes
- `app/admin/error.tsx` — Error boundary with retry button for admin routes
- `app/painel/loading.tsx` — Skeleton loading state for operator panel
- `app/painel/error.tsx` — Error boundary with retry button for operator panel
- `scripts/pre-merge-check.mjs` — Automated pre-merge validation script (tsc + lint + build + tests)
- `docs/AUDITORIA_CODIGO.md` — Complete code audit report with severity scores
- `docs/PADROES_CODIGO.md` — Code standards and conventions documentation

### Changed
- `app/termos/page.tsx` — Now redirects to `/termos-de-uso` (canonical URL)
- `app/termos-de-uso/page.tsx` — Now contains the full Terms of Use content (canonical)
- `package.json` — Moved `@types/qrcode` from `dependencies` to `devDependencies`
- `package.json` — Added `pre-merge` script: `node scripts/pre-merge-check.mjs`

---

## [2.0.0] — 2026-01-15

### Added
- **15 restaurant templates** — Pizzaria, Hamburgueria, Restaurante, Sushi, Bar, Açaí, Cafeteria, Doceria, Churrascaria, Quiosque, Comida Árabe/Mediterranea, Sorveteria, Pet, Confeitaria, Vegano
- **White-label SaaS platform** with multi-tenant architecture via Supabase RLS
- **Operator panel** (`/painel`) — Product, category, and menu management with visual editor
- **Affiliate program** with 6-tier commission structure (Bronze → Diamond)
- **Freelancer marketplace** for menu setup services
- **Admin panel** (`/admin`) — Full platform management (users, subscriptions, affiliates, payouts)
- **Mercado Pago integration** — Checkout, subscriptions, webhooks with signature validation
- **Groq SDK (LLaMA 3.3 70B)** — AI assistant for menu descriptions and chat
- **Cloudflare R2** — Image storage with presigned URLs
- **Upstash Redis** — Rate limiting for API routes
- **Supabase Auth** with `@supabase/ssr` and middleware protection
- **Row Level Security (RLS)** on all database tables
- **QR Code generation** for menus (`modules/qrcode`)
- **WhatsApp integration** for order forwarding
- **Onboarding flow** with team provisioning (2 business days SLA)
- **Trial system** with automatic expiry cron job
- **Coupon validation** (`/api/checkout/validar-cupom`)
- **SEO** — `app/sitemap.ts`, `app/robots.ts`, metadata, Open Graph tags
- **Security headers** — X-Frame-Options, X-Content-Type-Options, HSTS, CSP via `next.config.mjs`
- **Vercel cron jobs** — Subscription checks, SLA checks, access expiry, health checks, payouts, audits
- **Playwright E2E tests** — Admin, affiliate, checkout, security, and audit flows
- **Error tracking** with Sentry (`lib/error-tracking.ts`)
- **Feedback system** with order-linked reviews
- **Support ticket system** with SLA management
- **Google Analytics** via `@vercel/analytics`
- **Speed Insights** via `@vercel/speed-insights`
- **Demo mode** (`/demo`) — Preview templates without login
- **Cookie consent banner**
- **Dark/light mode** via `next-themes`
- **Responsive design** — Tailwind CSS 4, mobile-first
- **TypeScript strict mode** — Zero `any`, full type coverage

### Security
- All API routes protected by Supabase session or admin auth
- RLS policies on all Supabase tables
- `SECURITY DEFINER` + `SET search_path = public` on all database views and functions
- Rate limiting via Upstash Redis on critical endpoints
- Mercado Pago webhook signature validation
- CORS headers restricted to `https://zairyx.com`

[Unreleased]: https://github.com/TiagoIA-UX/Cardapio-Digital/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/TiagoIA-UX/Cardapio-Digital/releases/tag/v2.0.0
