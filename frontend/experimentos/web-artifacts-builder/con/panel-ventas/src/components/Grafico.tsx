import { useLayoutEffect, useRef, useState } from "react"

import { ANIO, MESES, capitalizar } from "@/lib/datos"

const ALTO = 264
const MARGEN = { arriba: 28, derecha: 12, abajo: 30, izquierda: 40 }

type Props = {
  tipo: "columnas" | "linea"
  titulo: string
  subtitulo: string
  /** Nombre de la serie, para tooltips y lectores de pantalla */
  serie: string
  /** Un valor por mes, en la unidad del eje */
  valores: number[]
  ticks: number[]
  color: string
  formatoTick: (n: number) => string
  formatoEtiqueta: (n: number) => string
  formatoValor: (n: number) => string
  /** Segunda línea del tooltip (variación vs. el mes anterior) */
  detalle: (i: number) => string | null
  activos: boolean[]
  hayFiltro: boolean
  hover: number | null
  onHover: (i: number | null) => void
  onToggle: (i: number) => void
}

function useAncho() {
  const ref = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setAncho(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setAncho(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, ancho] as const
}

export function Grafico({
  tipo,
  titulo,
  subtitulo,
  serie,
  valores,
  ticks,
  color,
  formatoTick,
  formatoEtiqueta,
  formatoValor,
  detalle,
  activos,
  hayFiltro,
  hover,
  onHover,
  onToggle,
}: Props) {
  const [ref, ancho] = useAncho()

  const n = valores.length
  const maxY = ticks[ticks.length - 1]
  const anchoPlot = Math.max(ancho - MARGEN.izquierda - MARGEN.derecha, 0)
  const altoPlot = ALTO - MARGEN.arriba - MARGEN.abajo
  const base = MARGEN.arriba + altoPlot
  const paso = anchoPlot / n
  const x = (i: number) => MARGEN.izquierda + paso * (i + 0.5)
  const y = (v: number) => base - (v / maxY) * altoPlot
  const anchoBarra = Math.min(24, paso * 0.5)

  // Sin filtro se rotulan los extremos; con filtro, los meses elegidos.
  const rotular = (i: number) => (hayFiltro ? activos[i] : i === 0 || i === n - 1)
  const tinte = (i: number) => (activos[i] ? color : "var(--deemph)")

  const columna = (i: number) => {
    const x0 = x(i) - anchoBarra / 2
    const y0 = y(valores[i])
    const r = Math.min(4, anchoBarra / 2, base - y0)
    return `M${x0},${base} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} H${
      x0 + anchoBarra - r
    } Q${x0 + anchoBarra},${y0} ${x0 + anchoBarra},${y0 + r} V${base} Z`
  }

  const izquierdaTooltip = hover !== null && x(hover) > ancho / 2

  return (
    <figure className="rounded-[3px] border border-[var(--hairline)] bg-[var(--surface-1)] p-5">
      <figcaption>
        <h2 className="text-[15px] font-semibold text-[var(--ink)]">{titulo}</h2>
        <p className="mt-0.5 text-[13px] text-[var(--ink-2)]">{subtitulo}</p>
      </figcaption>

      <div ref={ref} className="relative mt-3" style={{ height: ALTO }}>
        {ancho > 0 && (
          <svg
            width={ancho}
            height={ALTO}
            role="group"
            aria-label={`${titulo}. ${subtitulo}`}
            onPointerLeave={() => onHover(null)}
            className="block select-none"
          >
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={MARGEN.izquierda}
                  x2={ancho - MARGEN.derecha}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={t === 0 ? "var(--axis)" : "var(--grid)"}
                  strokeWidth={1}
                  shapeRendering="crispEdges"
                />
                <text
                  x={MARGEN.izquierda - 8}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={12}
                  fill="var(--muted-ink)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatoTick(t)}
                </text>
              </g>
            ))}

            {hover !== null && tipo === "columnas" && (
              <rect
                x={x(hover) - paso / 2 + 2}
                y={MARGEN.arriba - 8}
                width={Math.max(paso - 4, 0)}
                height={altoPlot + 8}
                fill="var(--wash)"
              />
            )}
            {hover !== null && tipo === "linea" && (
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={MARGEN.arriba - 8}
                y2={base}
                stroke="var(--axis)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
            )}

            {tipo === "columnas" &&
              valores.map((_, i) => (
                <path
                  key={i}
                  d={columna(i)}
                  fill={tinte(i)}
                  style={{
                    filter: hover === i ? "brightness(1.12)" : undefined,
                    transition: "fill 150ms ease-out",
                  }}
                />
              ))}

            {tipo === "linea" && (
              <>
                {valores.slice(1).map((v, k) => (
                  <line
                    key={k}
                    x1={x(k)}
                    y1={y(valores[k])}
                    x2={x(k + 1)}
                    y2={y(v)}
                    stroke={
                      activos[k] && activos[k + 1] ? color : "var(--deemph)"
                    }
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{ transition: "stroke 150ms ease-out" }}
                  />
                ))}
                {valores.map((v, i) => (
                  <circle
                    key={i}
                    cx={x(i)}
                    cy={y(v)}
                    r={hover === i ? 6 : 5}
                    fill={tinte(i)}
                    stroke="var(--surface-1)"
                    strokeWidth={2}
                    style={{ transition: "fill 150ms ease-out" }}
                  />
                ))}
              </>
            )}

            {valores.map(
              (v, i) =>
                rotular(i) && (
                  <text
                    key={i}
                    x={x(i)}
                    y={y(v) - (tipo === "linea" ? 13 : 8)}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="var(--ink)"
                    stroke="var(--surface-1)"
                    strokeWidth={4}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                  >
                    {formatoEtiqueta(v)}
                  </text>
                ),
            )}

            {MESES.map((m, i) => (
              <text
                key={m.id}
                x={x(i)}
                y={base + 19}
                textAnchor="middle"
                fontSize={12}
                fontWeight={hayFiltro && activos[i] ? 600 : 400}
                fill={hayFiltro && activos[i] ? "var(--ink)" : "var(--muted-ink)"}
              >
                {m.corto}
              </text>
            ))}

            {/* Zonas de interacción: toda la franja del mes, no solo la marca */}
            {MESES.map((m, i) => (
              <rect
                key={m.id}
                className="zona-mes"
                x={x(i) - paso / 2 + 2}
                y={MARGEN.arriba - 8}
                width={Math.max(paso - 4, 0)}
                height={altoPlot + MARGEN.abajo + 6}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-pressed={hayFiltro && activos[i]}
                aria-label={`${capitalizar(m.nombre)} de ${ANIO}: ${serie} ${formatoValor(
                  valores[i],
                )}. Filtrar por este mes.`}
                onPointerEnter={() => onHover(i)}
                onPointerMove={() => hover !== i && onHover(i)}
                onFocus={() => onHover(i)}
                onBlur={() => onHover(null)}
                onClick={() => onToggle(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onToggle(i)
                  }
                }}
              />
            ))}
          </svg>
        )}

        {hover !== null && ancho > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded-[3px] border border-[var(--hairline)] bg-[var(--surface-1)] px-3 py-2 shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
            style={{
              left: x(hover) + (izquierdaTooltip ? -14 : 14),
              top: Math.max(y(valores[hover]), 34),
              transform: `translate(${izquierdaTooltip ? "-100%" : "0"}, -50%)`,
            }}
          >
            <div className="text-[15px] font-semibold leading-tight text-[var(--ink)]">
              {formatoValor(valores[hover])}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--ink-2)]">
              <span
                aria-hidden
                className="inline-block h-[2px] w-3 rounded-full"
                style={{ background: color }}
              />
              {serie} · {MESES[hover].nombre} {ANIO}
            </div>
            {detalle(hover) && (
              <div className="mt-0.5 text-[12px] text-[var(--muted-ink)]">
                {detalle(hover)}
              </div>
            )}
          </div>
        )}
      </div>
    </figure>
  )
}
