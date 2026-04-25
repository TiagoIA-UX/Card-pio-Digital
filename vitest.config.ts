import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    exclude: [
      'tests/e2e/**',
      '**/*.spec.ts',
      'node_modules/**',
      'blog-subdomain-starter/**',
      'blog-terapia-elisa-rietjens__tmp/**',
    ],
  },
})

