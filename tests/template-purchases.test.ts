import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildVisibleTemplatePurchases,
  resolveTemplatePurchaseStatus,
  type ActivationEventRow,
  type OrderRow,
  type RestaurantRow,
  type TemplateCatalogEntry,
  type TemplateRow,
  type UserPurchaseRow,
} from '../lib/template-purchases'

describe('template purchases visibility', () => {
  it('shows only purchased templates instead of the whole catalog', () => {
    const purchases: UserPurchaseRow[] = [
      {
        id: 'purchase-1',
        template_id: 'template-1',
        order_id: 'order-1',
        status: 'pending',
        purchased_at: '2026-03-25T10:00:00.000Z',
      },
    ]
    const templates: TemplateRow[] = [
      { id: 'template-1', slug: 'pizzaria', name: 'Pizzaria', image_url: null },
      { id: 'template-2', slug: 'restaurante', name: 'Restaurante', image_url: null },
    ]
    const catalog: TemplateCatalogEntry[] = [
      { slug: 'pizzaria', name: 'Pizzaria', imageUrl: null },
      { slug: 'restaurante', name: 'Restaurante', imageUrl: null },
      { slug: 'bar', name: 'Bar', imageUrl: null },
    ]

    const visible = buildVisibleTemplatePurchases({
      purchaseRows: purchases,
      templateRows: templates,
      restaurants: [],
      activationEvents: [],
      orders: [{ id: 'order-1', payment_status: 'approved', status: 'paid' }],
      catalog,
    })

    assert.strictEqual(visible.length, 1)
    assert.strictEqual(visible[0].templateSlug, 'pizzaria')
  })

  it('resolves the linked restaurant when the provisioned restaurant exists', () => {
    const purchases: UserPurchaseRow[] = [
      {
        id: 'purchase-1',
        template_id: 'template-1',
        order_id: 'order-1',
        status: 'pending',
        purchased_at: '2026-03-25T10:00:00.000Z',
      },
    ]
    const templates: TemplateRow[] = [
      { id: 'template-1', slug: 'pizzaria', name: 'Pizzaria', image_url: null },
    ]
    const restaurants: RestaurantRow[] = [
      {
        id: 'restaurant-1',
        slug: 'pizza-da-matriz',
        nome: 'Pizza da Matriz',
        template_slug: 'pizzaria',
      },
    ]
    const orders: OrderRow[] = [
      {
        id: 'order-1',
        payment_status: 'approved',
        status: 'paid',
        metadata: { provisioned_restaurant_id: 'restaurant-1' },
      },
    ]
    const activationEvents: ActivationEventRow[] = []

    const visible = buildVisibleTemplatePurchases({
      purchaseRows: purchases,
      templateRows: templates,
      restaurants,
      activationEvents,
      orders,
      catalog: [{ slug: 'pizzaria', name: 'Pizzaria', imageUrl: null }],
    })

    assert.strictEqual(visible[0].restaurantId, 'restaurant-1')
    assert.strictEqual(visible[0].linkResolution, 'linked')
  })

  it('maps payment states to awaiting or failed statuses', () => {
    assert.strictEqual(
      resolveTemplatePurchaseStatus('pending', { id: '1', payment_status: 'pending' }),
      'awaiting_payment'
    )
    assert.strictEqual(
      resolveTemplatePurchaseStatus('pending', { id: '2', payment_status: 'rejected' }),
      'payment_failed'
    )
    assert.strictEqual(
      resolveTemplatePurchaseStatus('pending', { id: '3', payment_status: 'approved' }),
      'active'
    )
  })
})
