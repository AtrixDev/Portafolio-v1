# Revisión de seguridad de `server.js`

**Veredicto: así como está, no se puede publicar.** Cualquier persona en internet, sin usuario ni contraseña, puede ejecutar comandos en el servidor, bajarse la base de usuarios completa con sus contraseñas y entrar como cualquier cliente. Los cinco hallazgos críticos hay que arreglarlos sí o sí antes de salir.

Alcance: revisión estática de `server.js` (31 líneas), sin ejecutar nada. En la carpeta no hay `package.json`, así que no sé qué versión de Express usás; donde cambia el resultado, lo aclaro.

| # | Gravedad | Hallazgo | Línea |
|---|----------|----------|-------|
| 1 | Crítica | Ejecución de comandos en el servidor desde `/api/etiqueta` | 22 |
| 2 | Crítica | El "control de admin" es un header que manda cualquiera | 26 |
| 3 | Crítica | Login salteable con inyección NoSQL | 15 |
| 4 | Crítica | Ningún endpoint verifica quién sos; la cookie de sesión es falsificable | 9, 17, 21 |
| 5 | Crítica | Contraseñas guardadas en texto plano | 15 |
| 6 | Alta | Credenciales de la base escritas en el código (`admin:admin123`) | 7 |
| 7 | Alta | `/api/pedidos` devuelve pedidos de cualquier cliente | 10 |
| 8 | Alta | El login devuelve el documento entero del usuario | 18 |
| 9 | Media | El error del login devuelve la contraseña enviada, como HTML | 16 |
| 10 | Media | Sin límite de intentos en el login | 14 |
| 11 | Media | Errores sin manejar: un pedido mal formado puede tirar el servidor | 9–28 |
| 12 | Baja | Sin HTTPS, sin headers de seguridad, sin límites de tamaño | 6, 30 |

---

## Críticos

### 1. Ejecución de comandos en el servidor (`/api/etiqueta`, línea 22)

```js
exec('generar-etiqueta ' + req.query.pedido, ...)
```

`exec` le pasa el texto a un shell, y el texto incluye lo que manda el usuario. Con esto alcanza:

```
GET /api/etiqueta?pedido=1;cat /etc/passwd
```

El servidor ejecuta el segundo comando y encima devuelve la salida en la respuesta. No pide login. Quien lo encuentre controla el servidor: puede leer archivos, sacar las credenciales de la base e instalar lo que quiera.

**Cómo arreglarlo**

- Usar `execFile` en vez de `exec`, con los argumentos en un array. No hay shell de por medio, así que `;`, `|`, `$()` dejan de significar algo.
- Validar el formato antes de llamar. Si el id de pedido es un ObjectId de Mongo, aceptar solo eso. La validación también evita que alguien mande un valor que empiece con `-` y se interprete como opción del programa.
- Exigir sesión y verificar que el pedido sea del usuario (ver hallazgo 4).

```js
import { execFile } from 'child_process'

app.get('/api/etiqueta', requiereSesion, (req, res) => {
  const pedido = req.query.pedido
  if (typeof pedido !== 'string' || !/^[a-f0-9]{24}$/.test(pedido)) return res.status(400).end()
  execFile('generar-etiqueta', ['--', pedido], (err, out) => {
    if (err) return res.status(500).end()
    res.send(out)
  })
})
```

(El `--` sirve solo si `generar-etiqueta` lo respeta; con la validación de arriba no hace falta, pero no molesta.)

### 2. El control de admin es un header que manda cualquiera (`/api/admin/exportar`, línea 26)

```js
if (req.headers['x-admin'] === 'true') res.json(await db.collection('usuarios').find().toArray())
```

Los headers los elige el que hace el pedido. Esto no es un control de acceso:

```
curl -H 'x-admin: true' https://tienda.com/api/admin/exportar
```

Devuelve todos los usuarios con todos sus campos, contraseñas incluidas (ver hallazgo 5).

**Cómo arreglarlo**

- El rol de admin tiene que salir de la sesión del servidor, nunca de algo que mande el cliente: buscar el usuario de la sesión y chequear un campo `rol` guardado en la base.
- Devolver solo los campos necesarios con una proyección (`{ projection: { password: 0 } }` como mínimo) y paginar.
- Si la exportación es de uso interno, lo más seguro es sacarla de la API pública y dejarla como script o detrás de una VPN.

### 3. Login salteable con inyección NoSQL (línea 15)

```js
findOne({ email: req.body.email, password: req.body.password })
```

`express.json()` acepta objetos, no solo textos. Si en vez de una contraseña mando un operador de Mongo, la consulta deja de comparar:

```json
{ "email": "victima@mail.com", "password": { "$ne": null } }
```

Eso significa "contraseña distinta de null", o sea, cualquiera. Entro como esa persona sin saber la clave. Con `"email": { "$ne": null }` entro como el primer usuario de la colección, que suele ser el admin.

**Cómo arreglarlo**

- Verificar que `email` y `password` sean strings antes de tocar la base, y rechazar con 400 si no.
- Buscar solo por email y comparar la contraseña en el código con una librería de hashing (va de la mano con el hallazgo 5). Así la contraseña nunca entra en la consulta.

```js
const { email, password } = req.body ?? {}
if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).end()
const user = await db.collection('usuarios').findOne({ email })
if (!user || !(await argon2.verify(user.passwordHash, password))) return res.status(401).json({ ok: false })
```

Como red de contención general, conviene validar todos los cuerpos y query strings con un esquema (por ejemplo `zod`) en lugar de chequear campo por campo.

### 4. Ningún endpoint verifica quién sos; la cookie de sesión es falsificable (líneas 9, 17, 21)

Hay dos problemas juntos:

- El login setea una cookie, pero **ningún endpoint la lee**. `/api/pedidos` y `/api/etiqueta` atienden a cualquiera. Hoy el login es decorativo.
- La cookie es el `_id` del usuario, sin firma. El día que se empiece a usar, alcanza con conocer el `_id` de otro para ser esa persona. Los `_id` no son secretos: salen en la respuesta del login, en la exportación y en cualquier listado, y los ObjectId además son parcialmente predecibles (incluyen la fecha de creación y un contador).
- La cookie tampoco tiene `httpOnly`, `secure` ni `sameSite`, así que la puede leer JavaScript de la página, viaja por HTTP sin cifrar y se manda en pedidos originados desde otros sitios (CSRF).

**Cómo arreglarlo**

- Usar sesiones de servidor con un identificador aleatorio (por ejemplo `express-session` con un store en Mongo o Redis), no el id del usuario.
- Configurar la cookie con `httpOnly: true, secure: true, sameSite: 'lax'` y un vencimiento.
- Escribir un middleware `requiereSesion` y aplicarlo a todas las rutas salvo el login. Lo más seguro es ponerlo global (`app.use`) y exceptuar el login, así una ruta nueva queda protegida por defecto en vez de quedar abierta por olvido.
- Agregar un endpoint de logout que destruya la sesión.

### 5. Contraseñas en texto plano (línea 15)

La consulta compara `password` directamente contra lo guardado, lo que implica que la base tiene las contraseñas tal cual las escribió el usuario. Sumado al hallazgo 2, hoy cualquiera puede bajarse la lista de emails con sus contraseñas. Como la gente repite claves, el daño se extiende a sus cuentas de mail, banco, etc.

**Cómo arreglarlo**

- Guardar solo un hash con `argon2` (o `bcrypt`), nunca la contraseña.
- Migrar las cuentas existentes: hashear todas las contraseñas actuales en una pasada y borrar el campo viejo.
- Si la base ya estuvo accesible desde internet con este código, asumir que las contraseñas se filtraron y forzar el cambio de clave a todos los usuarios.

---

## Altos

### 6. Credenciales de la base en el código (línea 7)

```js
MongoClient.connect('mongodb://admin:admin123@db.tienda.com:27017')
```

- La contraseña queda en el repositorio y en su historial para siempre, visible para cualquiera con acceso al código.
- `admin123` es de las primeras que prueba cualquier ataque automatizado.
- Se conecta con el usuario `admin`, que puede hacer todo en la base. Combinado con el hallazgo 1 o el 3, el atacante se lleva o borra la base entera.
- La conexión no usa TLS, así que usuario, clave y datos viajan sin cifrar.

**Cómo arreglarlo**

- Cambiar la contraseña ya: la actual hay que darla por comprometida.
- Leer la cadena de conexión de una variable de entorno (`process.env.MONGO_URL`) o de un gestor de secretos, y hacer que el servidor no arranque si falta.
- Crear un usuario de Mongo solo para la aplicación, con permisos de lectura y escritura sobre la base `tienda` y nada más.
- Activar TLS (`?tls=true`) y verificar que el puerto 27017 no esté abierto a internet, solo al servidor de la API.

### 7. `/api/pedidos` devuelve pedidos de cualquier cliente (línea 10)

```js
find({ cliente: req.query.cliente })
```

El cliente lo elige quien hace el pedido, así que `?cliente=<otro>` muestra los pedidos de otra persona (nombre, dirección, lo que compró).

Además, con Express 4 el query string acepta objetos: `?cliente[$ne]=x` se convierte en `{ $ne: 'x' }` y devuelve **todos** los pedidos de la tienda de una. En Express 5 esa sintaxis viene desactivada por defecto, pero el primer problema sigue igual.

**Cómo arreglarlo**

- No aceptar el cliente por parámetro: tomarlo de la sesión (`find({ cliente: req.session.userId })`).
- Si un admin necesita consultar por cliente, que sea una ruta aparte con chequeo de rol, validando que el parámetro sea un string.
- Paginar los resultados con `limit`.

### 8. El login devuelve el documento entero del usuario (línea 18)

```js
res.json({ ok: true, user })
```

Manda al navegador todo lo que haya en el documento: la contraseña (o su hash, una vez arreglado el hallazgo 5), roles internos y cualquier campo que se agregue más adelante. Es un problema que empeora solo: cada campo nuevo en `usuarios` queda expuesto sin que nadie lo decida.

**Cómo arreglarlo**

- Armar la respuesta a mano con los campos que el frontend necesita: `res.json({ ok: true, user: { id: user._id, nombre: user.nombre, email: user.email } })`.

---

## Medios

### 9. El error del login devuelve lo que mandaste, como HTML (línea 16)

```js
res.status(401).send('Error: ' + JSON.stringify(req.body))
```

- Devuelve la contraseña recién tipeada en la respuesta, que puede terminar en logs de proxies o herramientas de monitoreo.
- `res.send` con un string responde como `text/html`, y el contenido lo controla el que hace el pedido. Explotarlo como XSS desde otro sitio es difícil (el navegador pide permiso CORS antes de mandar JSON), pero es una puerta que no hay por qué dejar entreabierta.

**Cómo arreglarlo**

- Responder un mensaje fijo: `res.status(401).json({ ok: false, error: 'Email o contraseña incorrectos' })`.

### 10. Sin límite de intentos en el login (línea 14)

Se pueden probar contraseñas sin tope. Con listas de claves filtradas de otros sitios, es cuestión de tiempo hasta que entren en algunas cuentas.

**Cómo arreglarlo**

- Agregar `express-rate-limit` en `/api/login`, limitando por IP y por email (por ejemplo, 5 intentos cada 15 minutos).
- Conviene también un límite general más laxo para toda la API.

### 11. Errores sin manejar (líneas 9–28)

- Ningún handler tiene `try/catch`. Con Express 4, si Mongo falla dentro de un handler `async`, el error queda sin atrapar y Node termina el proceso: la tienda se cae hasta que alguien la reinicie, y se puede provocar a propósito. Con Express 5 el error llega al manejador por defecto, que devuelve el stack trace salvo que `NODE_ENV=production` esté seteado.
- En `/api/etiqueta` se ignora `err`: si el comando falla, responde 200 vacío y nadie se entera.
- Si el body del login no es JSON, `req.body.email` puede romper (en Express 5 `req.body` queda `undefined`).

**Cómo arreglarlo**

- Usar Express 5 o envolver los handlers para que los errores lleguen a un middleware de errores propio, que loguee el detalle del lado del servidor y responda un 500 genérico.
- Correr con `NODE_ENV=production` y un gestor de procesos que reinicie el servicio (systemd, PM2, o el orquestador que uses).

---

## Bajos

### 12. Endurecimiento general (líneas 6, 30)

- **HTTPS:** el servidor escucha HTTP plano en el puerto 3000. Tiene que quedar detrás de un proxy con TLS (nginx, Caddy, o el balanceador del hosting); si no, contraseñas y cookies viajan en claro. Con proxy adelante, agregar `app.set('trust proxy', 1)` para que las cookies `secure` y el rate limit por IP funcionen bien.
- **Headers de seguridad:** agregar `helmet()`, que además saca el header `X-Powered-By: Express`.
- **Tamaño de los pedidos:** fijar el límite explícitamente (`express.json({ limit: '100kb' })`) en vez de depender del valor por defecto.
- **CORS:** hoy no hay configuración. Cuando se agregue, listar los orígenes permitidos uno por uno; nunca `*` junto con cookies.

---

## Orden sugerido

1. **Hoy, aunque no se publique:** cambiar la contraseña de Mongo y cerrar el puerto 27017 a internet (6). Si este código ya estuvo corriendo en un servidor accesible, tratar el servidor y la base como comprometidos.
2. **Antes de publicar:** hallazgos 1 a 8. El 3, 4 y 5 se resuelven juntos al rehacer el login con sesiones y hashing; el 2 y el 7 salen casi gratis una vez que existe el middleware de sesión.
3. **Misma tanda si se puede, o la semana siguiente:** 9 a 12.

Después de los arreglos conviene una segunda revisión: varios cambian la estructura del código (sesiones, validación), y ahí es donde aparecen los problemas nuevos.
