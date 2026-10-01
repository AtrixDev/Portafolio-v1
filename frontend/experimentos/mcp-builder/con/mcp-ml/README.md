# mercadolibre-mcp-server

Servidor MCP que le da a Claude acceso al catálogo de **Mercado Libre Argentina**. Con esto Claude puede:

- **Ver un producto de catálogo** por su ID: nombre, ficha técnica, características, fotos y quién gana la compra (buy box) y a qué precio.
- **Listar las publicaciones que compiten** en ese catálogo: precio, vendedor, condición, envío gratis, garantía y ubicación, con paginado.

Es de sólo lectura: no publica, no compra ni modifica nada.

---

## Antes de empezar: vas a necesitar credenciales

Aunque los datos del catálogo son públicos, **la API de Mercado Libre ya no responde pedidos anónimos**: sin token devuelve `401`/`403`. Así que necesitás crear una aplicación gratuita en Mercado Libre (tarda cinco minutos):

1. Entrá a <https://developers.mercadolibre.com.ar/devcenter> con tu cuenta de Mercado Libre.
2. Tocá **Crear aplicación** y completá los datos. Como URL de redirección podés poner cualquier URL `https` tuya (ej. `https://localhost.com`), porque este servidor no la usa.
3. Cuando la guardes, copiá el **Client ID** (App ID) y el **Client Secret**.

Con eso el servidor pide solo un token de aplicación y lo renueva automáticamente cada vez que vence (duran 6 horas). No tenés que hacer nada más.

> **Alternativa:** si ya tenés un access token (empieza con `APP_USR-...`), podés pasarlo en `ML_ACCESS_TOKEN`. Ojo que vence a las 6 horas y ahí vas a tener que reemplazarlo a mano. Por eso conviene usar Client ID + Secret.

## Requisitos

- **Node.js 18 o superior** (`node -v` para verificarlo).
- npm (viene con Node).

## Instalación

Desde la carpeta `mcp-ml/`:

```bash
npm install
npm run build
```

Esto genera `dist/index.js`, que es lo que va a ejecutar Claude. Anotate la **ruta absoluta** a ese archivo, porque la vas a necesitar para conectarlo. La sacás así:

```bash
echo "$(pwd)/dist/index.js"
```

## Cómo conectarlo a Claude

### Claude Desktop

1. Abrí el archivo de configuración (si no existe, crealo):
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

   También llegás desde Claude Desktop en **Configuración → Desarrollador → Editar configuración**.

2. Agregá el servidor dentro de `mcpServers` y reemplazá la ruta y las credenciales:

   ```json
   {
     "mcpServers": {
       "mercadolibre": {
         "command": "node",
         "args": ["/ruta/absoluta/a/mcp-ml/dist/index.js"],
         "env": {
           "ML_CLIENT_ID": "tu-client-id",
           "ML_CLIENT_SECRET": "tu-client-secret"
         }
       }
     }
   }
   ```

   En Windows, las barras de la ruta van dobles: `"C:\\Users\\vos\\mcp-ml\\dist\\index.js"`.

3. **Cerrá Claude Desktop del todo** (no alcanza con cerrar la ventana) y volvé a abrirlo. Las herramientas de Mercado Libre aparecen en el menú de conectores/herramientas del chat.

### Claude Code

Un solo comando:

```bash
claude mcp add mercadolibre \
  -e ML_CLIENT_ID=tu-client-id \
  -e ML_CLIENT_SECRET=tu-client-secret \
  -- node /ruta/absoluta/a/mcp-ml/dist/index.js
```

Por defecto queda disponible sólo en el proyecto actual. Si lo querés en todos tus proyectos, agregá `--scope user`. Para ver si conectó, corré `claude mcp list` o escribí `/mcp` dentro de Claude Code.

## Variables de entorno

| Variable | ¿Obligatoria? | Para qué sirve |
|---|---|---|
| `ML_CLIENT_ID` | Sí (o usá `ML_ACCESS_TOKEN`) | Client ID de tu app de Mercado Libre. |
| `ML_CLIENT_SECRET` | Sí (o usá `ML_ACCESS_TOKEN`) | Client Secret de tu app. |
| `ML_ACCESS_TOKEN` | Opcional | Token fijo. Sólo se usa si no definiste Client ID y Secret. Vence a las 6 horas. |

Si no hay ninguna credencial configurada, el servidor no arranca y te avisa qué falta.

## Herramientas disponibles

### `mercadolibre_get_catalog_product`

Trae los datos de un producto de catálogo.

- `product_id`: el ID (`MLA19615208`) o directamente la URL del catálogo.
- `response_format`: `markdown` (por defecto) o `json`.

### `mercadolibre_list_catalog_listings`

Lista las publicaciones de distintos vendedores que compiten en ese catálogo.

- `product_id`: el ID o la URL del catálogo.
- `limit`: cuántas publicaciones traer, de 1 a 50 (por defecto 20).
- `offset`: desde qué posición seguir, para paginar.
- `response_format`: `markdown` o `json`.

Además de la lista, devuelve el total, si hay más páginas y el precio mínimo y máximo **de la página actual**. El orden es el que da Mercado Libre, que no siempre es por precio. Si le pedís a Claude "el más barato", va a recorrer las páginas que haga falta.

## ¿De dónde saco el ID del producto?

Buscá el producto en mercadolibre.com.ar y fijate la URL. Las páginas de catálogo tienen `/p/` seguido del ID:

```
https://www.mercadolibre.com.ar/samsung-galaxy-s23-256-gb/p/MLA19615208
                                                           ^^^^^^^^^^^
```

Le podés pasar a Claude esa URL entera, que el servidor extrae el ID solo.

**No confundir** con las URLs de publicaciones individuales (`articulo.mercadolibre.com.ar/MLA-123456789-...`). Esas son de un vendedor puntual y no son un producto de catálogo, así que el servidor las rechaza con un mensaje claro.

## Ejemplos para pedirle a Claude

- "¿Qué es el producto MLA19615208 de Mercado Libre y cuál es su ficha técnica?"
- "¿Quién gana la buy box de https://www.mercadolibre.com.ar/.../p/MLA19615208 y a qué precio?"
- "Listame todas las publicaciones que compiten en MLA19615208 y decime cuál es la más barata con envío gratis."
- "¿Cuántos vendedores venden este producto y cuál es la diferencia entre el precio más alto y el más bajo?"

## Probarlo sin Claude

Con el MCP Inspector podés llamar a las herramientas desde el navegador:

```bash
ML_CLIENT_ID=tu-client-id ML_CLIENT_SECRET=tu-client-secret npm run inspector
```

## Problemas frecuentes

- **"Faltan credenciales"**: no llegaron las variables de entorno. En Claude Desktop, revisá que estén dentro de `env` en el JSON y reiniciá la app.
- **"No se pudo obtener el token… invalid client_id or client_secret"**: el Client ID o el Secret están mal copiados, o regeneraste el Secret en el DevCenter.
- **"el access token es inválido o venció"**: estás usando `ML_ACCESS_TOKEN` y pasaron más de 6 horas. Pasate a Client ID + Secret.
- **Error 403 "la aplicación no tiene permiso"**: Mercado Libre bloqueó el pedido por política. Revisá en el DevCenter que la app esté activa y que la hayas creado con una cuenta de Argentina. Si persiste, probá con un token de usuario en `ML_ACCESS_TOKEN`.
- **"no existe el producto de catálogo"**: el ID no es de catálogo (fijate que venga de una URL con `/p/`) o el producto fue dado de baja.
- **Claude no ve las herramientas**: la ruta en `args` tiene que ser absoluta y apuntar a `dist/index.js`. Acordate de correr `npm run build` antes.

## Estructura del proyecto

```
mcp-ml/
├── src/
│   ├── index.ts              # Arranque del servidor (stdio)
│   ├── constants.ts          # URL de la API, timeouts, límites
│   ├── types.ts              # Tipos de las respuestas de Mercado Libre
│   ├── schemas/products.ts   # Esquemas Zod de entrada y salida
│   ├── services/auth.ts      # Obtención y renovación del token
│   ├── services/api.ts       # Cliente HTTP y manejo de errores
│   ├── services/format.ts    # Formato de precios, IDs y truncado
│   └── tools/products.ts     # Las dos herramientas MCP
└── dist/                     # JavaScript compilado (npm run build)
```
