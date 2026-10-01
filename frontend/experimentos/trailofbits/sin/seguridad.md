# Revisión de seguridad de `server.js`

**Fecha:** 30/09/2026
**Alcance:** `server.js` (30 líneas), leído a mano. No se ejecutó nada ni se probó contra la base real.
**Conclusión:** así como está, **no se puede publicar**. Hay tres fallas que cualquiera explota con un solo request y sin estar logueado: ejecutar comandos en el servidor, bajarse toda la tabla de usuarios y entrar como cualquier usuario sin saber la contraseña.

## Resumen

| # | Gravedad | Hallazgo | Línea |
|---|----------|----------|-------|
| 1 | Crítica | Inyección de comandos en `/api/etiqueta` | 22 |
| 2 | Crítica | El "control de admin" es un header que manda el cliente | 26 |
| 3 | Crítica | Inyección NoSQL en el login: se entra sin contraseña | 15 |
| 4 | Alta | Credenciales de Mongo en el código, débiles, de admin y sin TLS | 7 |
| 5 | Alta | Ningún endpoint verifica quién sos: se leen pedidos ajenos | 9-12, 21-23 |
| 6 | Alta | Contraseñas en texto plano, y el login las devuelve | 15, 18 |
| 7 | Alta | La cookie de sesión es el `_id` del usuario, sin firma ni flags | 17 |
| 8 | Media | Un request mal formado puede tirar el proceso | 9-28 |
| 9 | Media | Sin límite de intentos en el login ni en los endpoints caros | 14, 21 |
| 10 | Baja | El login devuelve el body tal cual, como HTML | 16 |
| 11 | Baja | Endurecimiento general que falta | — |

Lo que no pude revisar está al final, en [Fuera de alcance](#fuera-de-alcance).

---

## Críticas

### 1. Inyección de comandos en `/api/etiqueta` (línea 22)

```js
exec('generar-etiqueta ' + req.query.pedido, ...)
```

`exec` le pasa el string a un shell, y `pedido` viene directo de la URL. Cualquiera, sin loguearse, ejecuta lo que quiera con los permisos del proceso de Node:

```
GET /api/etiqueta?pedido=1;cat%20/etc/passwd
```

Además la salida del comando vuelve en la respuesta, así que el atacante ve el resultado. Desde ahí lee el código, la contraseña de la base (hallazgo 4) y todo lo que el servidor alcance.

**Cómo arreglarlo**

- Usar `execFile` con los argumentos en un array, que no pasa por un shell.
- Validar que `pedido` tenga el formato esperado antes de usarlo. Esto hace falta igual con `execFile`: un valor que empiece con `-` se interpretaría como una opción del programa.
- Ponerle `timeout` y no ignorar `err`.
- Exigir sesión y verificar que el pedido sea del usuario (hallazgo 5).

```js
import { execFile } from 'child_process'

app.get('/api/etiqueta', requiereSesion, async (req, res) => {
  const pedido = req.query.pedido
  if (typeof pedido !== 'string' || !/^[a-f0-9]{24}$/.test(pedido)) return res.status(400).end()
  // verificar acá que el pedido pertenece a req.usuario
  execFile('generar-etiqueta', ['--', pedido], { timeout: 10_000 }, (err, out) => {
    if (err) return res.status(500).end()
    res.type('text/plain').send(out)
  })
})
```

Ajustá la expresión regular al formato real de los identificadores de pedido, y confirmá que `generar-etiqueta` acepte `--` como fin de opciones.

### 2. El control de admin es un header que manda el cliente (línea 26)

```js
if (req.headers['x-admin'] === 'true') res.json(await db.collection('usuarios').find().toArray())
```

Los headers los elige quien hace el request. Esto alcanza para bajarse todos los usuarios, con sus contraseñas:

```
curl -H 'x-admin: true' https://tienda/api/admin/exportar
```

**Cómo arreglarlo**

- Sacar el chequeo del header. El rol tiene que salir de la sesión validada en el servidor (hallazgo 7), mirando un campo como `rol` del usuario en la base.
- Excluir siempre los campos sensibles, incluso para un admin real: `find({}, { projection: { password: 0 } })`.
- Si no hace falta para el lanzamiento, no publicar este endpoint, o dejarlo accesible solo desde la red interna.

### 3. Inyección NoSQL en el login (línea 15)

```js
findOne({ email: req.body.email, password: req.body.password })
```

El body es JSON, así que `email` y `password` pueden ser objetos en vez de strings, y Mongo los interpreta como operadores. Con esto se entra como el primer usuario de la colección, que suele ser el admin:

```json
{ "email": { "$ne": null }, "password": { "$ne": null } }
```

Y con `{ "email": "victima@mail.com", "password": { "$ne": null } }` se entra como una persona concreta. Como la respuesta incluye el documento completo (línea 18), también se lleva su contraseña.

**Cómo arreglarlo**

- Rechazar todo lo que no sea string antes de consultar:

  ```js
  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).end()
  ```

- Mejor todavía, validar todos los bodies y query strings con un esquema (zod, joi o similar) en cada endpoint.
- Buscar solo por `email` y comparar la contraseña aparte contra el hash (hallazgo 6). Con eso la contraseña deja de formar parte de la consulta.

---

## Altas

### 4. Credenciales de Mongo en el código (línea 7)

```js
MongoClient.connect('mongodb://admin:admin123@db.tienda.com:27017')
```

Son cuatro problemas en una línea:

- La contraseña está en el código fuente, así que la ve cualquiera con acceso al repositorio o a sus copias.
- `admin123` se adivina en los primeros intentos de cualquier diccionario.
- La API se conecta como `admin`, así que cualquier falla de la API da control total de la base.
- La URL no pide TLS, y la base está en otro host: usuario, contraseña y datos viajan sin cifrar.

No probé si el puerto 27017 de `db.tienda.com` está abierto a internet. Si lo está, esto pasa a ser crítico: se entra a la base directamente, sin pasar por la API.

**Cómo arreglarlo**

- Cambiar la contraseña ya. Darla por comprometida aunque el repo sea privado.
- Leer la URL de una variable de entorno o un gestor de secretos: `MongoClient.connect(process.env.MONGO_URL)`.
- Crear un usuario de Mongo solo para la API, con `readWrite` sobre la base `tienda` y nada más.
- Activar TLS (`?tls=true` o `mongodb+srv://`).
- Cerrar el puerto 27017 con firewall para que solo entre el servidor de la API.

### 5. Ningún endpoint verifica quién sos (líneas 9-12 y 21-23)

El login pone una cookie, pero ningún endpoint la lee. En la práctica la API no tiene autenticación.

- `/api/pedidos?cliente=X` devuelve los pedidos de cualquier cliente con solo conocer o adivinar su identificador.
- `/api/etiqueta` genera la etiqueta de cualquier pedido, con los datos de envío que traiga.

En `/api/pedidos` puede haber además inyección de operadores, según la versión de Express. En Express 4, `?cliente[$ne]=x` llega como el objeto `{ $ne: 'x' }` y devuelve **todos** los pedidos de la tienda. En Express 5 el parser por defecto no arma objetos y esto no pasa. No hay `package.json` en la carpeta, así que no sé cuál de los dos casos aplica.

**Cómo arreglarlo**

- Un middleware `requiereSesion` que valide la sesión y cargue `req.usuario`, aplicado a todo menos al login.
- Sacar el cliente de la sesión y no de la URL: `find({ cliente: req.usuario._id })`.
- En `/api/etiqueta`, buscar el pedido y comprobar que sea del usuario antes de generar nada.
- Validar que los parámetros sean strings, igual que en el hallazgo 3.

### 6. Contraseñas en texto plano (líneas 15 y 18)

La consulta compara `password` directamente contra lo guardado, o sea que las contraseñas están en la base tal cual. Cualquier fuga de la colección `usuarios` (y los hallazgos 1 a 4 dan cuatro formas de conseguirla) expone la contraseña de todos los clientes, que muchos reutilizan en el mail o el banco.

Encima, `res.json({ ok: true, user })` le devuelve al navegador el documento completo, contraseña incluida.

**Cómo arreglarlo**

- Guardar un hash con argon2id (paquete `argon2`) o bcrypt, y verificar con la función de la librería:

  ```js
  const user = await db.collection('usuarios').findOne({ email })
  if (!user || !(await argon2.verify(user.passwordHash, password))) {
    return res.status(401).json({ error: 'Credenciales inválidas' })
  }
  ```

- Migrar las contraseñas existentes: hashearlas todas en un script y borrar el campo en texto plano.
- Devolver solo lo que el frontend necesita, por ejemplo `{ ok: true, user: { id, nombre, email } }`.

### 7. Cookie de sesión insegura (línea 17)

```js
res.cookie('session', user._id.toString())
```

- El valor es el `_id` del usuario. No es un secreto: aparece en otras respuestas de la API y no cambia nunca. Cuando algún endpoint empiece a confiar en esta cookie, cualquiera que conozca el `_id` de otro va a poder hacerse pasar por esa persona escribiendo la cookie a mano.
- No vence ni se puede revocar: no hay forma de cerrar sesión.
- No tiene `httpOnly`, `secure` ni `sameSite`, así que la lee JavaScript, viaja por HTTP sin cifrar y se manda en requests originados en otros sitios (CSRF).

**Cómo arreglarlo**

Usar sesiones del lado del servidor, con un identificador aleatorio. Con `express-session` y un store en Mongo o Redis:

```js
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ client }),
  cookie: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 },
}))
```

En el login, llamar a `req.session.regenerate()` antes de guardar el usuario, y agregar un endpoint de logout que destruya la sesión.

---

## Medias

### 8. Un request mal formado puede tirar el proceso (líneas 9-28)

Ningún handler `async` tiene manejo de errores. En Express 4 una promesa rechazada dentro de un handler no la atrapa nadie, y Node termina el proceso. Un operador inválido alcanza para provocarlo:

```json
{ "email": { "$noexiste": 1 }, "password": "x" }
```

Mongo rechaza la consulta y la API se cae para todos. En Express 5 el error se atrapa y sale un 500, pero con el stack trace en la respuesta si `NODE_ENV` no es `production`.

**Cómo arreglarlo**

- Usar Express 5, o envolver los handlers en `try/catch` si se queda en la 4.
- Agregar al final un middleware de errores que loguee el detalle y responda un 500 genérico.
- Correr con `NODE_ENV=production` y bajo un supervisor que reinicie el proceso (systemd, pm2, el orquestador de contenedores).
- La validación de tipos del hallazgo 3 evita este caso puntual.

### 9. Sin límite de intentos (líneas 14 y 21)

- El login acepta intentos ilimitados: se pueden probar contraseñas por fuerza bruta o con listas filtradas de otros sitios.
- `/api/etiqueta` lanza un proceso por request y `/api/admin/exportar` y `/api/pedidos` traen colecciones enteras a memoria. Pocas llamadas en paralelo alcanzan para saturar el servidor.

**Cómo arreglarlo**

- `express-rate-limit` en el login, por IP y por email (por ejemplo 5 intentos cada 15 minutos), y un límite global más holgado para el resto.
- Paginar los listados con `limit` y `skip`, o con cursor.
- El `timeout` de `execFile` del hallazgo 1.

---

## Bajas

### 10. El login devuelve el body como HTML (línea 16)

```js
res.status(401).send('Error: ' + JSON.stringify(req.body))
```

`res.send` con un string responde como `text/html`, y `JSON.stringify` no escapa `<` ni `>`. Si el body trae `<script>`, el navegador lo ejecutaría. Hoy es difícil de explotar, porque hace falta que el navegador de la víctima mande un POST con `Content-Type: application/json` desde otro sitio y eso lo frena la política de mismo origen. Pero deja de ser difícil el día que se agregue CORS.

Además devuelve la contraseña que el usuario acaba de tipear, que puede quedar en logs de proxies o herramientas de monitoreo.

**Cómo arreglarlo:** responder un mensaje fijo, sin datos del request: `res.status(401).json({ error: 'Credenciales inválidas' })`.

### 11. Endurecimiento general

- **HTTPS:** `app.listen(3000)` sirve HTTP plano. Tiene que haber un proxy con TLS adelante (nginx, Caddy, el balanceador del proveedor). En ese caso, configurar `app.set('trust proxy', 1)` para que las cookies `secure` y el rate limit por IP funcionen.
- **Headers:** agregar `helmet()` y `app.disable('x-powered-by')`.
- **Salida de `/api/etiqueta`:** se manda como HTML. El `res.type('text/plain')` del hallazgo 1 lo resuelve.
- **Campos `undefined`:** si falta `cliente` o `email`, el driver de Mongo manda `null` y la consulta matchea documentos sin ese campo. La validación de tipos del hallazgo 3 lo cubre.
- **Logs de auditoría:** registrar logins fallidos y accesos de admin, sin contraseñas ni cookies.

---

## Orden sugerido para arreglar

1. Cambiar la contraseña de Mongo y cerrar el puerto (4). Es lo único que puede estar expuesto ahora mismo, antes de publicar la API.
2. Antes de publicar, sí o sí: 1, 2, 3, 5, 6 y 7. Las sesiones (7) y el middleware de autenticación (5) son la base de la que dependen 1 y 2.
3. En la misma tanda, porque son cambios chicos: 8, 9 y 10.
4. Después: 11.

## Fuera de alcance

- **Dependencias:** no hay `package.json` ni lockfile en la carpeta, así que no revisé versiones ni vulnerabilidades conocidas. Corré `npm audit` antes de publicar. La versión de Express cambia el alcance de los hallazgos 5 y 8.
- **`generar-etiqueta`:** no vi el programa. Si procesa el identificador de forma insegura por su cuenta, hay que revisarlo aparte.
- **Infraestructura:** firewall, configuración de Mongo, proxy, backups y permisos del usuario que corre Node.
- **Frontend** y cualquier otro archivo del proyecto.
