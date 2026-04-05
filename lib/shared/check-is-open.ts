// =====================================================
// CHECK IS OPEN — Utility compartilhada (server + client)
// Verifica se o restaurante está aberto baseado no horário
// =====================================================

import type { HorarioFuncionamento } from '@/types/database'

const DAY_MAP: Record<number, keyof HorarioFuncionamento> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado',
}

/**
 * Verifica se o restaurante está aberto agora.
 * Se não há horário configurado, assume aberto.
 */
export function checkIsOpen(horarios: HorarioFuncionamento | null | undefined): boolean {
  if (!horarios) return true

  const now = new Date()
  const dayOfWeek = now.getDay()
  const currentTime = now.toTimeString().slice(0, 5) // HH:mm

  const todayKey = DAY_MAP[dayOfWeek]
  const todayHorario = horarios[todayKey]

  if (!todayHorario || !todayHorario.aberto) return false

  return currentTime >= todayHorario.abre && currentTime <= todayHorario.fecha
}
