import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

import { Grafico } from "@/components/Grafico"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  ANIO,
  MESES,
  type Mes,
  cambioPct,
  capitalizar,
  enMillones,
  millones,
  pesos,
  porcentaje,
  variacionPct,
  variacionPp,
} from "@/lib/datos"
import { cn } from "@/lib/utils"

const TOTAL_SEMESTRE = MESES.reduce((s, m) => s + m.ventas, 0)

const chip =
  "h-8 min-w-0 rounded-[3px] border border-[var(--hairline)] bg-transparent px-3 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--wash)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=on]:border-[var(--ink)] data-[state=on]:bg-[var(--ink)] data-[state=on]:text-[var(--page)]"

function describirPeriodo(activos: Mes[]) {
  const cuantos = `${activos.length} meses`
  if (activos.length === 1) {
    return `${capitalizar(activos[0].nombre)} de ${ANIO}`
  }
  const primero = MESES.indexOf(activos[0])
  const corridos = activos.every((m, i) => MESES.indexOf(m) === primero + i)
  if (corridos) {
    const ultimo = activos[activos.length - 1]
    return `${capitalizar(activos[0].nombre)} a ${ultimo.nombre} de ${ANIO} · ${cuantos}`
  }
  const cortos = activos.map((m) => m.corto)
  const lista = `${cortos.slice(0, -1).join(", ")} y ${cortos[cortos.length - 1]}`
  return `${capitalizar(lista)} de ${ANIO} · ${cuantos}`
}

/** Variación con flecha y texto: el color nunca va solo. */
function Variacion({
  valor,
  texto,
  subeEsBueno,
  className,
}: {
  valor: number
  texto: string
  subeEsBueno: boolean
  className?: string
}) {
  const Icono = valor > 0 ? ArrowUp : valor < 0 ? ArrowDown : Minus
  const esBueno = valor === 0 ? null : valor > 0 === subeEsBueno
  return (
    <span
      className={cn("inline-flex items-center gap-1 font-medium", className)}
      style={{
        color:
          esBueno === null
            ? "var(--ink-2)"
            : esBueno
              ? "var(--good)"
              : "var(--bad)",
      }}
    >
      <Icono aria-hidden className="size-3.5" strokeWidth={2.5} />
      {texto}
    </span>
  )
}

function App() {
  // Vacío = todos los meses.
  const [seleccion, setSeleccion] = useState<string[]>([])
  const [hover, setHover] = useState<number | null>(null)

  const hayFiltro = seleccion.length > 0
  const elegir = (ids: string[]) =>
    setSeleccion(ids.length === MESES.length ? [] : ids)
  const alternar = (i: number) => {
    const id = MESES[i].id
    elegir(
      seleccion.includes(id)
        ? seleccion.filter((s) => s !== id)
        : [...seleccion, id],
    )
  }

  const resumen = useMemo(() => {
    const activos = hayFiltro
      ? MESES.filter((m) => seleccion.includes(m.id))
      : MESES
    const total = activos.reduce((s, m) => s + m.ventas, 0)
    const acos = activos.reduce((s, m) => s + m.acos, 0) / activos.length

    // Un solo mes se compara con el anterior; varios, el último contra el primero.
    const ultimo = activos[activos.length - 1]
    const base =
      activos.length > 1 ? activos[0] : MESES[MESES.indexOf(ultimo) - 1]
    const comparacion = base && {
      etiqueta:
        activos.length > 1
          ? `${ultimo.corto} vs. ${base.corto}`
          : `vs. ${base.nombre}`,
      ventas: cambioPct(ultimo.ventas, base.ventas),
      acos: ultimo.acos - base.acos,
    }

    return { activos, total, acos, comparacion }
  }, [seleccion, hayFiltro])

  const { activos, total, acos, comparacion } = resumen
  const unSoloMes = activos.length === 1
  const marcados = MESES.map((m) => activos.includes(m))

  const detalleVentas = (i: number) =>
    i === 0
      ? null
      : `${variacionPct(cambioPct(MESES[i].ventas, MESES[i - 1].ventas))} vs. ${MESES[i - 1].nombre}`
  const detalleAcos = (i: number) =>
    i === 0
      ? null
      : `${variacionPp(MESES[i].acos - MESES[i - 1].acos)} vs. ${MESES[i - 1].nombre}`

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)]">
      <main className="mx-auto max-w-[1120px] px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <header>
          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-2)]">
            <span aria-hidden className="size-2.5 bg-[var(--marca)]" />
            Tienda en Mercado Libre
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.015em] sm:text-[32px]">
            Ventas y ACOS por mes
          </h1>
          <p className="mt-1 text-[14px] text-[var(--ink-2)]">
            Junio a noviembre de {ANIO} · en pesos argentinos
          </p>
        </header>

        {/* Filtro: una sola fila, arriba de todo lo que afecta */}
        <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span id="filtro-mes" className="text-[13px] font-medium text-[var(--ink-2)]">
            Mes
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              aria-pressed={!hayFiltro}
              data-state={hayFiltro ? "off" : "on"}
              onClick={() => setSeleccion([])}
              className={chip}
            >
              Todos
            </button>
            <ToggleGroup
              type="multiple"
              aria-labelledby="filtro-mes"
              value={seleccion}
              onValueChange={elegir}
              className="contents"
            >
              {MESES.map((m) => (
                <ToggleGroupItem
                  key={m.id}
                  value={m.id}
                  aria-label={`${capitalizar(m.nombre)} de ${ANIO}`}
                  className={chip}
                >
                  {capitalizar(m.corto)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <span className="text-[13px] text-[var(--muted-ink)]">
            Podés elegir uno o varios meses.
          </span>
        </div>

        {/* Resumen */}
        <section
          aria-label="Resumen del período"
          aria-live="polite"
          className="mt-5 grid border-y border-[var(--axis)] md:grid-cols-[1.5fr_1fr_1fr]"
        >
          <div className="py-6 md:pr-8">
            <p className="text-[13px] font-medium text-[var(--ink-2)]">
              {unSoloMes ? "Ventas del mes" : "Ventas del período"}
            </p>
            <p className="mt-1 text-[52px] font-semibold leading-none tracking-[-0.03em] sm:text-[64px]">
              <span className="mr-1.5 text-[0.5em] font-medium tracking-normal text-[var(--ink-2)]">
                $
              </span>
              {enMillones(total)}
              <span className="ml-1.5 text-[0.5em] font-medium tracking-normal text-[var(--ink-2)]">
                M
              </span>
            </p>
            <p className="mt-3 text-[13px] text-[var(--ink-2)]">
              {describirPeriodo(activos)}
            </p>
            <p className="mt-1 text-[13px]">
              {comparacion ? (
                <Variacion
                  valor={comparacion.ventas}
                  texto={`${variacionPct(comparacion.ventas)} · ${comparacion.etiqueta}`}
                  subeEsBueno
                />
              ) : (
                <span className="text-[var(--muted-ink)]">
                  Primer mes del período: sin mes anterior para comparar.
                </span>
              )}
            </p>
          </div>

          <div className="border-t border-[var(--grid)] py-6 md:border-l md:border-t-0 md:px-8">
            <p className="text-[13px] font-medium text-[var(--ink-2)]">
              {unSoloMes ? "ACOS del mes" : "ACOS promedio"}
            </p>
            <p className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.02em]">
              {porcentaje(acos)}
            </p>
            <p className="mt-3 text-[13px] text-[var(--ink-2)]">
              {unSoloMes
                ? "Costo publicitario sobre ventas"
                : `Promedio simple de ${activos.length} meses`}
            </p>
            {comparacion && (
              <p className="mt-1 text-[13px]">
                <Variacion
                  valor={comparacion.acos}
                  texto={`${variacionPp(comparacion.acos)} · ${comparacion.etiqueta}`}
                  subeEsBueno={false}
                />
              </p>
            )}
          </div>

          <div className="border-t border-[var(--grid)] py-6 md:border-l md:border-t-0 md:pl-8">
            <p className="text-[13px] font-medium text-[var(--ink-2)]">
              {unSoloMes ? "Peso en el semestre" : "Promedio mensual"}
            </p>
            <p className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.02em]">
              {unSoloMes
                ? porcentaje((total / TOTAL_SEMESTRE) * 100)
                : millones(total / activos.length)}
            </p>
            <p className="mt-3 text-[13px] text-[var(--ink-2)]">
              {unSoloMes
                ? `De los ${millones(TOTAL_SEMESTRE)} vendidos entre junio y noviembre`
                : "Ventas por mes en el período elegido"}
            </p>
          </div>
        </section>

        {/* Gráficos: un eje por medida, nunca doble eje */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Grafico
            tipo="columnas"
            titulo="Ventas"
            subtitulo="Millones de pesos por mes"
            serie="Ventas"
            valores={MESES.map((m) => m.ventas / 1e6)}
            ticks={[0, 10, 20, 30]}
            color="var(--series-1)"
            formatoTick={(n) => String(n)}
            formatoEtiqueta={(n) => enMillones(n * 1e6)}
            formatoValor={(n) => millones(n * 1e6)}
            detalle={detalleVentas}
            activos={marcados}
            hayFiltro={hayFiltro}
            hover={hover}
            onHover={setHover}
            onToggle={alternar}
          />
          <Grafico
            tipo="linea"
            titulo="ACOS"
            subtitulo="Costo publicitario sobre ventas · cuanto más bajo, mejor"
            serie="ACOS"
            valores={MESES.map((m) => m.acos)}
            ticks={[0, 10, 20, 30]}
            color="var(--series-2)"
            formatoTick={porcentaje}
            formatoEtiqueta={porcentaje}
            formatoValor={porcentaje}
            detalle={detalleAcos}
            activos={marcados}
            hayFiltro={hayFiltro}
            hover={hover}
            onHover={setHover}
            onToggle={alternar}
          />
        </div>
        <p className="mt-2 text-[12px] text-[var(--muted-ink)]">
          Tocá un mes en cualquiera de los gráficos para sumarlo o sacarlo del
          filtro.
        </p>

        {/* Tabla: los mismos números, sin depender del hover */}
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold">Detalle por mes</h2>
          <div className="mt-3 rounded-[3px] border border-[var(--hairline)] bg-[var(--surface-1)]">
            <Table className="whitespace-nowrap text-[13px] [font-variant-numeric:tabular-nums]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[var(--ink-2)]">Mes</TableHead>
                  <TableHead className="text-right text-[var(--ink-2)]">
                    Ventas
                  </TableHead>
                  <TableHead className="text-right text-[var(--ink-2)]">
                    Var. vs. mes anterior
                  </TableHead>
                  <TableHead className="text-right text-[var(--ink-2)]">
                    ACOS
                  </TableHead>
                  <TableHead className="text-right text-[var(--ink-2)]">
                    Var. vs. mes anterior
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activos.map((m) => {
                  const previo = MESES[MESES.indexOf(m) - 1]
                  return (
                    <TableRow key={m.id} className="hover:bg-[var(--wash)]">
                      <TableCell className="font-medium">
                        {capitalizar(m.nombre)} {ANIO}
                      </TableCell>
                      <TableCell className="text-right">
                        {pesos(m.ventas)}
                      </TableCell>
                      <TableCell className="text-right">
                        {previo ? (
                          <Variacion
                            valor={m.ventas - previo.ventas}
                            texto={variacionPct(
                              cambioPct(m.ventas, previo.ventas),
                            )}
                            subeEsBueno
                            className="justify-end"
                          />
                        ) : (
                          <span className="text-[var(--muted-ink)]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {porcentaje(m.acos)}
                      </TableCell>
                      <TableCell className="text-right">
                        {previo ? (
                          <Variacion
                            valor={m.acos - previo.acos}
                            texto={variacionPp(m.acos - previo.acos)}
                            subeEsBueno={false}
                            className="justify-end"
                          />
                        ) : (
                          <span className="text-[var(--muted-ink)]">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              {!unSoloMes && (
                <TableFooter className="bg-transparent">
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="font-semibold">
                      Total · {activos.length} meses
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {pesos(total)}
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right font-semibold">
                      {porcentaje(acos)}
                      <span className="ml-1 font-normal text-[var(--muted-ink)]">
                        prom.
                      </span>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
