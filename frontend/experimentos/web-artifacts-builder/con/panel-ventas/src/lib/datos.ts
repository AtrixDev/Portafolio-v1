export type Mes = {
  id: string
  corto: string
  nombre: string
  /** Ventas del mes, en pesos */
  ventas: number
  /** ACOS del mes, en % */
  acos: number
}

export const ANIO = 2025

export const MESES: Mes[] = [
  { id: "2025-06", corto: "jun", nombre: "junio", ventas: 18_400_000, acos: 30 },
  { id: "2025-07", corto: "jul", nombre: "julio", ventas: 19_900_000, acos: 24 },
  { id: "2025-08", corto: "ago", nombre: "agosto", ventas: 21_100_000, acos: 17 },
  { id: "2025-09", corto: "sep", nombre: "septiembre", ventas: 23_000_000, acos: 14 },
  { id: "2025-10", corto: "oct", nombre: "octubre", ventas: 24_300_000, acos: 13 },
  { id: "2025-11", corto: "nov", nombre: "noviembre", ventas: 25_600_000, acos: 12 },
]

const nf0 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const nfFlex = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 })

export const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** 18400000 → "18,4" */
export const enMillones = (pesos: number) => nf1.format(pesos / 1e6)

/** 18400000 → "$ 18,4 M" */
export const millones = (pesos: number) => `$ ${enMillones(pesos)} M`

/** 18400000 → "$ 18.400.000" */
export const pesos = (n: number) => `$ ${nf0.format(n)}`

/** 18.33 → "18,3%" · 12 → "12%" */
export const porcentaje = (n: number) => `${nfFlex.format(n)}%`

const signo = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "")

/** 39.13 → "+39,1%" */
export const variacionPct = (n: number) =>
  `${signo(n)}${nf1.format(Math.abs(n))}%`

/** -18 → "−18 pp" */
export const variacionPp = (n: number) =>
  `${signo(n)}${nfFlex.format(Math.abs(n))} pp`

/** Variación porcentual de `actual` respecto de `base` */
export const cambioPct = (actual: number, base: number) =>
  ((actual - base) / base) * 100
