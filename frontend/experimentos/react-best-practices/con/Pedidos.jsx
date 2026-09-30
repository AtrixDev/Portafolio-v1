import { useEffect, useMemo, useState } from 'react'

const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

const estiloItem = { padding: 8 }

async function obtenerJSON(url, signal) {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Error ${res.status} al pedir ${url}`)
  return res.json()
}

export default function Pedidos({ clienteId }) {
  const [datos, setDatos] = useState({ cliente: null, pedidos: [], stock: [] })
  const [estado, setEstado] = useState('cargando') // 'cargando' | 'listo' | 'error'
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    const id = encodeURIComponent(clienteId)

    setEstado('cargando')
    setError(null)

    // Las tres consultas son independientes: van en paralelo, no en cascada.
    Promise.all([
      obtenerJSON(`/api/clientes/${id}`, signal),
      obtenerJSON(`/api/pedidos?cliente=${id}`, signal),
      obtenerJSON('/api/stock', signal),
    ])
      .then(([cliente, pedidos, stock]) => {
        if (signal.aborted) return
        setDatos({ cliente, pedidos, stock })
        setEstado('listo')
      })
      .catch(err => {
        if (signal.aborted) return
        setError(err)
        setEstado('error')
      })

    return () => controller.abort()
  }, [clienteId])

  const { cliente, pedidos, stock } = datos

  const stockPorProducto = useMemo(
    () => new Map(stock.map(s => [s.id, s.cantidad])),
    [stock]
  )

  const termino = filtro.trim().toLowerCase()
  const visibles = termino
    ? pedidos.filter(p => p.producto.toLowerCase().includes(termino))
    : pedidos
  const total = visibles.reduce((t, p) => t + p.precio * p.cantidad, 0)

  if (estado === 'cargando') return <p role="status">Cargando pedidos…</p>
  if (estado === 'error') return <p role="alert">No se pudieron cargar los pedidos: {error.message}</p>

  return (
    <section>
      <h2>{cliente?.nombre}</h2>
      <input
        type="search"
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        placeholder="Buscar"
        aria-label="Buscar producto"
      />
      {visibles.length === 0 ? (
        <p>No hay pedidos que coincidan.</p>
      ) : (
        <ul>
          {visibles.map(p => (
            <li key={p.id}>
              <button type="button" style={estiloItem} onClick={() => alert(p.id)}>
                {p.producto} — {p.cantidad} u. — stock: {stockPorProducto.get(p.productoId) ?? '—'}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p>Total: {formatoMoneda.format(total)}</p>
    </section>
  )
}
