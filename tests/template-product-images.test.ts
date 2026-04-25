import test from 'node:test'
import assert from 'node:assert/strict'

import { getCategoryFallbackImage, getProductFallbackImage } from '@/lib/domains/marketing/templates-config'
import { resolveTemplateProductImage, resolveTemplateProductImageUrl } from '@/lib/domains/image/template-product-images'

test('minimercado reaproveita imagem legada do mercadinho por nome e categoria compativel', () => {
  const imageUrl = resolveTemplateProductImageUrl({
    templateSlug: 'minimercado',
    fallbackTemplateImageUrl: 'https://example.com/banner.jpg',
    product: {
      nome: 'Coca-Cola Lata 350ml',
      descricao: 'Refrigerante Coca-Cola original lata gelada',
      preco: 4.99,
      categoria: 'Bebidas',
      ordem: 1,
    },
  })

  assert.equal(
    imageUrl,
    'https://images.pexels.com/photos/2530319/pexels-photo-2530319.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
})

test('molhos especiais usa fallback valido', () => {
  assert.equal(
    getCategoryFallbackImage('Molhos Especiais'),
    'https://images.pexels.com/photos/5779367/pexels-photo-5779367.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
})

test('categorias novas do minimercado nao caem mais no banner por falta de fallback', () => {
  assert.ok(getCategoryFallbackImage('Bebê & Infantil'))
  assert.ok(getCategoryFallbackImage('Farmácia Básica'))
  assert.ok(getCategoryFallbackImage('Papelaria'))
  assert.ok(getCategoryFallbackImage('Tabacaria & Conveniência'))
  assert.ok(getCategoryFallbackImage('Importados & Gourmet'))
  assert.ok(getCategoryFallbackImage('Fitness & Saúde'))
})

test('fallback por nome separa subtipos de produto em vez de cair na categoria ampla', () => {
  assert.equal(
    getProductFallbackImage('Água Mineral 500ml', 'Bebidas'),
    'https://images.pexels.com/photos/1540235/pexels-photo-1540235.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
  assert.equal(
    getProductFallbackImage('Feijão Preto Camil 1kg', 'Mercearia'),
    'https://images.pexels.com/photos/4716798/pexels-photo-4716798.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
  assert.equal(
    getProductFallbackImage('Shampoo Dove 400ml', 'Higiene Pessoal'),
    'https://images.pexels.com/photos/7262987/pexels-photo-7262987.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
})

test('fallback por nome nao usa palavra ampla fora da categoria esperada', () => {
  assert.equal(getProductFallbackImage('Água Sanitária Ypê 2L', 'Limpeza'), 'https://images.pexels.com/photos/5217889/pexels-photo-5217889.jpeg?auto=compress&cs=tinysrgb&w=800')
  assert.equal(getProductFallbackImage('Escorredor de Arroz', 'Utilidades'), undefined)
})

test('fallback por nome cobre hortifruti, pet e kits com regras especificas', () => {
  assert.equal(
    getProductFallbackImage('Banana Nanica kg', 'Hortifruti'),
    'https://images.pexels.com/photos/5009732/pexels-photo-5009732.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
  assert.equal(
    getProductFallbackImage('Ração Pedigree Adulto 3kg', 'Pet & Animais'),
    'https://images.pexels.com/photos/796584/pexels-photo-796584.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
  assert.equal(
    getProductFallbackImage('Kit Churrasco Premium', 'Kits & Combos'),
    'https://images.pexels.com/photos/4253618/pexels-photo-4253618.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
})

test('fallback por nome cobre lacunas grandes de higiene, snacks, fitness, pratos e utilidades', () => {
  assert.equal(
    getProductFallbackImage('Creme para Pentear Salon Line 300ml', 'Higiene Pessoal'),
    'https://images.pexels.com/photos/7428095/pexels-photo-7428095.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
  assert.equal(
    getProductFallbackImage('Fandangos Presunto 45g', 'Snacks & Doces'),
    'https://images.pexels.com/photos/7033942/pexels-photo-7033942.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
  assert.equal(
    getProductFallbackImage('Whey Protein 900g', 'Fitness & Saúde'),
    'https://images.pexels.com/photos/4397841/pexels-photo-4397841.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
  assert.equal(
    getProductFallbackImage('Marmita Fitness Frango 350g', 'Pratos Prontos'),
    'https://images.pexels.com/photos/6879452/pexels-photo-6879452.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
  assert.equal(
    getProductFallbackImage('Pilha AA Duracell 4un', 'Utilidades'),
    'https://images.pexels.com/photos/7019805/pexels-photo-7019805.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
})

test('resolvedor usa fallback por nome antes do fallback generico de categoria', () => {
  const resolved = resolveTemplateProductImage({
    templateSlug: 'minimercado',
    fallbackTemplateImageUrl: 'https://example.com/banner.jpg',
    product: {
      nome: 'Papel Higiênico Personal 4un',
      descricao: 'Papel higiênico folha dupla 4 unidades',
      preco: 6.99,
      categoria: 'Higiene Pessoal',
      ordem: 9999,
    },
  })

  assert.equal(resolved.source, 'product-fallback')
  assert.equal(
    resolved.url,
    'https://images.pexels.com/photos/3963082/pexels-photo-3963082.jpeg?auto=compress&cs=tinysrgb&w=800'
  )
})
