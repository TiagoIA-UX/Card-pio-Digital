/**
 * Formata valor para moeda brasileira (Real)
 * @example formatCurrency(10.5) => "R$ 10,50"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
