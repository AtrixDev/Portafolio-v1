// Precios de venta para Mercado Libre
export function precioConComision(costo, comisionPct) {
  return costo / (1 - comisionPct / 100)
}

// Precio de venta mínimo para no perder plata (margen 0) en una venta.
// Comisión, IIBB y ACOS son porcentajes sobre el precio de venta; costo, envío
// y cargo fijo son montos por unidad. Todos los montos tienen que estar en la
// misma base (todos con IVA o todos sin IVA).
//
//   precio = (costo + envio + cargoFijo) / (1 - (comisionPct + iibbPct + acosPct) / 100)
//
// Redondea para arriba al centavo, así el redondeo nunca deja el margen negativo.
export function precioMinimo({ costo, comisionPct, envio, iibbPct, acosPct, cargoFijo = 0 }) {
  const valores = { costo, comisionPct, envio, iibbPct, acosPct, cargoFijo }
  for (const [nombre, valor] of Object.entries(valores)) {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
      throw new Error(`precioMinimo: ${nombre} tiene que ser un número mayor o igual a 0 (llegó ${valor})`)
    }
  }

  const pctSobrePrecio = comisionPct + iibbPct + acosPct
  if (pctSobrePrecio >= 100) {
    throw new Error(
      `precioMinimo: comisión + IIBB + ACOS suman ${pctSobrePrecio}%, no hay precio que cubra los costos`
    )
  }

  const precio = (costo + envio + cargoFijo) / (1 - pctSobrePrecio / 100)
  // toFixed(6) descarta el ruido de punto flotante antes de redondear para arriba
  return Math.ceil(Number((precio * 100).toFixed(6))) / 100
}
