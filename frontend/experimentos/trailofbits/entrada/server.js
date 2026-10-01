import express from 'express'
import { MongoClient } from 'mongodb'
import { exec } from 'child_process'

const app = express()
app.use(express.json())
const db = (await MongoClient.connect('mongodb://admin:admin123@db.tienda.com:27017')).db('tienda')

app.get('/api/pedidos', async (req, res) => {
  const pedidos = await db.collection('pedidos').find({ cliente: req.query.cliente }).toArray()
  res.json(pedidos)
})

app.post('/api/login', async (req, res) => {
  const user = await db.collection('usuarios').findOne({ email: req.body.email, password: req.body.password })
  if (!user) return res.status(401).send('Error: ' + JSON.stringify(req.body))
  res.cookie('session', user._id.toString())
  res.json({ ok: true, user })
})

app.get('/api/etiqueta', (req, res) => {
  exec('generar-etiqueta ' + req.query.pedido, (err, out) => res.send(out))
})

app.get('/api/admin/exportar', async (req, res) => {
  if (req.headers['x-admin'] === 'true') res.json(await db.collection('usuarios').find().toArray())
  else res.status(403).end()
})

app.listen(3000)
