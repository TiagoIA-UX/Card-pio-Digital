import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DATA_BLOCK_TO_EDITOR, INITIAL_FORM, type FormState } from '../lib/domains/core/editor/types'

describe('editor types', () => {
  it('INITIAL_FORM contains all FormState keys with sensible defaults', () => {
    const keys: (keyof FormState)[] = [
      'nome',
      'telefone',
      'endereco_texto',
      'google_maps_url',
      'logo_url',
      'banner_url',
      'slogan',
      'heroSloganPreset',
      'badge',
      'heroTitle',
      'heroDescription',
      'sectionTitle',
      'sectionDescription',
      'aboutTitle',
      'aboutDescription',
      'primaryCtaLabel',
      'secondaryCtaLabel',
      'deliveryLabel',
      'pickupLabel',
      'dineInLabel',
    ]
    for (const key of keys) {
      assert.ok(key in INITIAL_FORM, `missing key: ${key}`)
    }
    assert.equal(INITIAL_FORM.deliveryLabel, 'Entrega')
    assert.equal(INITIAL_FORM.pickupLabel, 'Retirada')
    assert.equal(INITIAL_FORM.dineInLabel, 'Consumir no local')
    assert.equal(INITIAL_FORM.heroSloganPreset, 'custom')
  })

  it('DATA_BLOCK_TO_EDITOR maps all preview data blocks to editor blocks', () => {
    // Derived from block-schema — includes colors→structure that the schema defines
    assert.equal(DATA_BLOCK_TO_EDITOR['header'], 'negocio')
    assert.equal(DATA_BLOCK_TO_EDITOR['banner'], 'branding')
    assert.equal(DATA_BLOCK_TO_EDITOR['hero'], 'hero')
    assert.equal(DATA_BLOCK_TO_EDITOR['service'], 'service')
    assert.equal(DATA_BLOCK_TO_EDITOR['products'], 'products')
    assert.equal(DATA_BLOCK_TO_EDITOR['product-card'], 'products')
    assert.equal(DATA_BLOCK_TO_EDITOR['about'], 'about')
    assert.equal(DATA_BLOCK_TO_EDITOR['address'], 'negocio')
    assert.equal(DATA_BLOCK_TO_EDITOR['colors'], 'structure')
  })
})

