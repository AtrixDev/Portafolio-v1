// Precios de venta para Mercado Libre
export function precioConComision(costo, comisionPct) {
  return costo / (1 - comisionPct / 100)
}
