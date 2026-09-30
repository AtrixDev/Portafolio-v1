import { useEffect, useMemo, useState } from 'react'

const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

async function obtenerJson(url, signal) {
  const respuesta = await fetch(url, { signal })
  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status} al pedir ${url}`)
  }
  return respuesta.json()
}

export default function Pedidos({ clienteId }) {
  const [cliente, setCliente] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [stock, setStock] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function cargar() {
      setCargando(true)
      setError(null)
      try {
        const [c, p, s] = await Promise.all([
          obtenerJson(`/api/clientes/${encodeURIComponent(clienteId)}`, signal),
          obtenerJson(`/api/pedidos?cliente=${encodeURIComponent(clienteId)}`, signal),
          obtenerJson('/api/stock', signal),
        ])
        setCliente(c)
        setPedidos(p)
        setStock(s)
      } catch (e) {
        if (e.name !== 'AbortError') setError(e)
      } finally {
        if (!signal.aborted) setCargando(false)
      }
    }

    cargar()
    return () => controller.abort()
  }, [clienteId])

  const stockPorProducto = useMemo(
    () => new Map(stock.map(s => [s.id, s.cantidad])),
    [stock]
  )

  const visibles = useMemo(() => {
    const busqueda = filtro.trim().toLowerCase()
    if (!busqueda) return pedidos
    return pedidos.filter(p => p.producto.toLowerCase().includes(busqueda))
  }, [pedidos, filtro])

  const total = visibles.reduce((t, p) => t + p.precio * p.cantidad, 0)

  if (cargando) return <p>Cargando pedidos…</p>
  if (error) return <p role="alert">No se pudieron cargar los pedidos: {error.message}</p>

  return (
    <div>
      <h2>{cliente?.nombre}</h2>
      <input
        type="search"
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        placeholder="Buscar"
        aria-label="Buscar pedidos por producto"
      />
      {visibles.length === 0 ? (
        <p>No hay pedidos para mostrar.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {visibles.map(p => (
            <li key={p.id}>
              <button type="button" style={{ padding: 8 }} onClick={() => alert(p.id)}>
                {p.producto} — {p.cantidad} u. — stock: {stockPorProducto.get(p.productoId) ?? '—'}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p>Total: {formatoMoneda.format(total)}</p>
    </div>
  )
}
