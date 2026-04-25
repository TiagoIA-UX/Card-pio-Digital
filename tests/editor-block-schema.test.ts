import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  EDITOR_BLOCK_SCHEMA,
  PREVIEW_TO_EDITOR_BLOCK,
  FIELD_TO_BLOCK,
  INLINE_TEXT_FIELD_IDS,
  INLINE_IMAGE_FIELD_IDS,
  getBlockDefinition,
  getBlockFields,
} from '../lib/domains/core/editor/block-schema'

describe('editor block schema', () => {
  it('defines all 7 editor blocks', () => {
    const ids = EDITOR_BLOCK_SCHEMA.map((b) => b.id)
    assert.deepEqual(ids.sort(), [
      'about',
      'branding',
      'hero',
      'negocio',
      'products',
      'service',
      'structure',
    ])
  })

  it('PREVIEW_TO_EDITOR_BLOCK maps all preview data-blocks', () => {
    assert.equal(PREVIEW_TO_EDITOR_BLOCK['header'], 'negocio')
    assert.equal(PREVIEW_TO_EDITOR_BLOCK['banner'], 'branding')
    assert.equal(PREVIEW_TO_EDITOR_BLOCK['hero'], 'hero')
    assert.equal(PREVIEW_TO_EDITOR_BLOCK['service'], 'service')
    assert.equal(PREVIEW_TO_EDITOR_BLOCK['products'], 'products')
    assert.equal(PREVIEW_TO_EDITOR_BLOCK['product-card'], 'products')
    assert.equal(PREVIEW_TO_EDITOR_BLOCK['about'], 'about')
    assert.equal(PREVIEW_TO_EDITOR_BLOCK['address'], 'negocio')
  })

  it('FIELD_TO_BLOCK maps fields to their parent block', () => {
    assert.equal(FIELD_TO_BLOCK['nome'], 'negocio')
    assert.equal(FIELD_TO_BLOCK['logo_url'], 'branding')
    assert.equal(FIELD_TO_BLOCK['heroTitle'], 'hero')
    assert.equal(FIELD_TO_BLOCK['sectionTitle'], 'products')
    assert.equal(FIELD_TO_BLOCK['aboutTitle'], 'about')
    assert.equal(FIELD_TO_BLOCK['deliveryLabel'], 'service')
    assert.equal(FIELD_TO_BLOCK['heroVisible'], 'structure')
  })

  it('inline text fields match the INLINE_TEXT_FIELDS constant', () => {
    const expected = new Set([
      'badge',
      'heroTitle',
      'heroDescription',
      'primaryCtaLabel',
      'secondaryCtaLabel',
      'sectionTitle',
      'sectionDescription',
      'aboutTitle',
      'aboutDescription',
    ])
    assert.deepEqual(INLINE_TEXT_FIELD_IDS, expected)
  })

  it('inline image fields are logo_url and banner_url', () => {
    assert.deepEqual(INLINE_IMAGE_FIELD_IDS, new Set(['logo_url', 'banner_url']))
  })

  it('getBlockDefinition returns the correct block', () => {
    const hero = getBlockDefinition('hero')
    assert.ok(hero)
    assert.equal(hero.label, 'Hero / Banner principal')
    assert.ok(hero.fields.length >= 3)
  })

  it('getBlockFields returns empty array for unknown block', () => {
    const fields = getBlockFields('unknown' as never)
    assert.deepEqual(fields, [])
  })
})

