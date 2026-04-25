import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildRestaurantSuspendedNotificationPayload,
  getSuspendedContactWhatsapp,
} from '@/lib/shared/notifications'

test('notificações de suspensão priorizam whatsapp do responsável', () => {
  assert.equal(
    getSuspendedContactWhatsapp({
      restaurantName: 'Delivery Centro',
      ownerWhatsapp: '5511999999999',
      restaurantPhone: '5511888888888',
    }),
    '5511999999999'
  )

  assert.equal(
    getSuspendedContactWhatsapp({
      restaurantName: 'Delivery Centro',
      restaurantPhone: '5511888888888',
    }),
    '5511888888888'
  )
})

test('notificações de suspensão montam payload auditável com dados resolvidos', () => {
  const payload = buildRestaurantSuspendedNotificationPayload(
    {
      restaurantId: 'rest-1',
      restaurantName: 'Delivery Centro',
      ownerEmail: 'fallback@example.com',
      daysOverdue: 12,
    },
    {
      restaurantName: 'Delivery Centro Premium',
      ownerName: 'Tiago',
      ownerEmail: 'tiago@example.com',
      ownerWhatsapp: '5511999999999',
      restaurantPhone: '5511888888888',
    }
  )

  assert.equal(payload.severity, 'critical')
  assert.equal(payload.channel, 'subscription')
  assert.equal(payload.emailAdmin, true)
  assert.match(payload.title, /Delivery Centro Premium/)
  assert.match(payload.body, /12 dias vencido/)
  assert.match(payload.body, /WhatsApp: 5511999999999/)
  assert.deepEqual(payload.metadata, {
    restaurantId: 'rest-1',
    restaurantName: 'Delivery Centro',
    ownerEmail: 'fallback@example.com',
    daysOverdue: 12,
    resolved_owner_name: 'Tiago',
    resolved_owner_email: 'tiago@example.com',
    resolved_owner_whatsapp: '5511999999999',
    resolved_restaurant_phone: '5511888888888',
    resolved_restaurant_name: 'Delivery Centro Premium',
  })
})

