import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCustomizationFromDraft,
  buildDisplayCategories,
  buildPreviewRestaurant,
} from '../lib/domains/core/editor/draft-adapter'
import { INITIAL_FORM } from '../lib/domains/core/editor/types'
import type { CardapioRestaurant } from '../lib/domains/core/cardapio-renderer'

const BASE_RESTAURANT: CardapioRestaurant = {
  id: 'r1',
  user_id: 'u1',
  nome: 'DB Nome',
  slug: 'db-slug',
  telefone: '11999999999',
  logo_url: 'https://example.com/old-logo.png',
  banner_url: null,
  slogan: null,
  cor_primaria: '#ff0000',
  cor_secundaria: '#0000ff',
  template_slug: 'pizzaria',
  ativo: true,
}

describe('draft-adapter', () => {
  describe('buildCustomizationFromDraft', () => {
    it('returns all section flags as true', () => {
      const c = buildCustomizationFromDraft(INITIAL_FORM, [])
      assert.deepStrictEqual(c.sections, {
        hero: true,
        service: true,
        categories: true,
        about: true,
      })
    })

    it('passes custom categories when non-empty', () => {
      const c = buildCustomizationFromDraft(INITIAL_FORM, ['Pizza', 'Bebida'])
      assert.deepStrictEqual(c.customCategories, ['Pizza', 'Bebida'])
    })

    it('omits custom categories when empty', () => {
      const c = buildCustomizationFromDraft(INITIAL_FORM, [])
      assert.strictEqual(c.customCategories, undefined)
    })

    it('maps form text fields to customization', () => {
      const form = { ...INITIAL_FORM, heroTitle: 'Bem-vindo', aboutTitle: 'Sobre nós' }
      const c = buildCustomizationFromDraft(form, [])
      assert.strictEqual(c.heroTitle, 'Bem-vindo')
      assert.strictEqual(c.aboutTitle, 'Sobre nós')
    })
  })

  describe('buildPreviewRestaurant', () => {
    it('returns null when restaurant is null', () => {
      const result = buildPreviewRestaurant(null, INITIAL_FORM, {})
      assert.strictEqual(result, null)
    })

    it('overlays form fields on the DB restaurant', () => {
      const form = { ...INITIAL_FORM, nome: 'Novo Nome', slogan: 'Slogan' }
      const result = buildPreviewRestaurant(BASE_RESTAURANT, form, {})!
      assert.strictEqual(result.nome, 'Novo Nome')
      assert.strictEqual(result.slogan, 'Slogan')
      // preserves DB fields not in the form
      assert.strictEqual(result.cor_primaria, '#ff0000')
      assert.strictEqual(result.slug, 'db-slug')
    })

    it('falls back to DB nome when form.nome is empty', () => {
      const form = { ...INITIAL_FORM, nome: '' }
      const result = buildPreviewRestaurant(BASE_RESTAURANT, form, {})!
      assert.strictEqual(result.nome, 'DB Nome')
    })

    it('falls back to default when both form and DB nome are empty', () => {
      const form = { ...INITIAL_FORM, nome: '' }
      const r = { ...BASE_RESTAURANT, nome: '' }
      const result = buildPreviewRestaurant(r, form, {})!
      assert.strictEqual(result.nome, 'Seu delivery')
    })

    it('trims whitespace-only address to null', () => {
      const form = { ...INITIAL_FORM, endereco_texto: '   ' }
      const result = buildPreviewRestaurant(BASE_RESTAURANT, form, {})!
      assert.strictEqual(result.endereco_texto, null)
    })

    it('injects customization into the result', () => {
      const cust = { sections: { hero: true } }
      const result = buildPreviewRestaurant(BASE_RESTAURANT, INITIAL_FORM, cust)!
      assert.deepStrictEqual(result.customizacao, cust)
    })
  })

  describe('buildDisplayCategories', () => {
    it('returns sorted product categories when no custom categories', () => {
      const result = buildDisplayCategories([], ['Doces', 'Bebidas', 'Pizzas'])
      assert.deepStrictEqual(result, ['Bebidas', 'Doces', 'Pizzas'])
    })

    it('prioritizes custom categories then appends unseen product categories', () => {
      const result = buildDisplayCategories(['Promoções', 'Pizzas'], ['Pizzas', 'Bebidas'])
      assert.deepStrictEqual(result, ['Promoções', 'Pizzas', 'Bebidas'])
    })

    it('deduplicates product categories', () => {
      const result = buildDisplayCategories([], ['Pizza', 'Pizza', 'Bebida'])
      assert.deepStrictEqual(result, ['Bebida', 'Pizza'])
    })

    it('filters out empty strings from product categories', () => {
      const result = buildDisplayCategories([], ['Pizza', '', 'Bebida'])
      assert.deepStrictEqual(result, ['Bebida', 'Pizza'])
    })
  })
})

