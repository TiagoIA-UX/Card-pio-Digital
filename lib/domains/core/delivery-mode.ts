export type DeliveryMode = 'whatsapp_only' | 'terminal_only' | 'hybrid'

const VALID_MODES: DeliveryMode[] = ['whatsapp_only', 'terminal_only', 'hybrid']

export function resolveDeliveryMode(
  deliveryMode?: string | null,
  customizacao?: Record<string, unknown> | null
): DeliveryMode {
  const override = customizacao?.delivery_mode
  if (typeof override === 'string' && VALID_MODES.includes(override as DeliveryMode)) {
    return override as DeliveryMode
  }

  if (typeof deliveryMode === 'string' && VALID_MODES.includes(deliveryMode as DeliveryMode)) {
    return deliveryMode as DeliveryMode
  }

  return 'whatsapp_only'
}

export function isTerminalEnabled(mode: DeliveryMode): boolean {
  return mode === 'terminal_only' || mode === 'hybrid'
}

export function isWhatsAppEnabled(mode: DeliveryMode): boolean {
  return mode === 'whatsapp_only' || mode === 'hybrid'
}

