import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "**/.next/**",
    "out/**",
    "build/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "01CardapioDigital/**"
  ])
])
