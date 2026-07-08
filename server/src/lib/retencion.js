export function calcularRetefuente(concepto, valorFactura, rates) {
  const rate = rates.find((r) => r.concepto === concepto)
  if (!rate) return 0
  if (valorFactura <= rate.baseGravable) return 0
  return Math.round(valorFactura * rate.porcentaje * 100) / 100
}
