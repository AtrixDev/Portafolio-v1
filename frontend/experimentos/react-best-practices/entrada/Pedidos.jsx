import { useEffect, useState } from 'react'

export default function Pedidos({ clienteId }) {
  const [cliente, setCliente] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [stock, setStock] = useState([])
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    async function cargar() {
      const c = await fetch(`/api/clientes/${clienteId}`).then(r => r.json())
      setCliente(c)
      const p = await fetch(`/api/pedidos?cliente=${clienteId}`).then(r => r.json())
      setPedidos(p)
      const s = await fetch('/api/stock').then(r => r.json())
      setStock(s)
    }
    cargar()
  })

  const visibles = pedidos.filter(p => p.producto.toLowerCase().includes(filtro.toLowerCase()))
  const total = visibles.reduce((t, p) => t + p.precio * p.cantidad, 0)

  return (
    <div>
      <h2>{cliente?.nombre}</h2>
      <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Buscar" />
      {visibles.map((p, i) => (
        <div key={i} style={{ padding: 8 }} onClick={() => alert(p.id)}>
          {p.producto} — {p.cantidad} u. — stock: {stock.find(s => s.id === p.productoId)?.cantidad}
        </div>
      ))}
      <p>Total: ${total}</p>
    </div>
  )
}
